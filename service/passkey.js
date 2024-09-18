const { Entity } = require('@drumee/server-core');
const { uniqueId, Attr } = require("@drumee/server-essentials");
const { Fido2Lib } = require('fido2-lib');
const base64url = require('base64url');
const { domain, endpoint, domain_desc } = sysEnv();
const Challenges = new Map();
const origin = `https://${domain}`;
class Passkey extends Entity {

  /**
   * 
   */
  async getRegnOptions() {
    let rpIcon = `${endpoint}/avatar/${this.uid}?type=vignette`;
    let displayName = this.user.get(Attr.fullname);
    let username = this.user.get(Attr.username);
    let uid = this.user.get(Attr.uid);
    const fido2 = new Fido2Lib({
      timeout: 60000,
      rpId: domain,
      rpName: domain_desc,
      rpIcon,
      challengeSize: 32,
      attestation: "none",
      authenticatorAttachment: "cross-platform", // For cross-platform devices like phones
    });
    const user = {
      id: base64url.encode(uid), // Encode userId in Base64Url format
      name: username,
      displayName,
    };

    // Generate challenge options for registering a new passkey
    const options = await fido2.attestationOptions();
    options.user = user;
    this.debug("AAA:36", options)

    // Save challenge in user session
    const key = uniqueId();
    Challenges.set(key, options.challenge);
    this.output.data({ key, options });
  }

  /**
   * 
   */
  async register() {
    const { id, rawId, response, type, key } = this.input.data();

    try {
      const { clientDataJSON, attestationObject } = response;

      // Get challenge from user session (mocked here as in-memory)
      const challenge = Challenges.get(key);
      Challenges.delete(key);

      // Verify the attestation
      const attestationResult = await fido2.attestationResult(
        { id, rawId, response: { clientDataJSON, attestationObject }, type },
        { challenge, origin }
      );
      const { authnrData } = attestationResult;
      // Store the public key credential for the user
      await this.yp.await_proc('passkey_store', this.uid, authnrData);
      this.output.data({ status: Attr.ok })
    } catch (error) {
      this.warn('Error registering passkey:', error);
      this.exception.server("RESTRATION_FAILED")
    }
  }

  /**
   * 
   */
  async getAuthnOptions() {
    const uid = this.input.need(Attr.uid);
    const passkey = await this.yp.await_proc('passkey_get', uid);
    if (!passkey) {
      this.exception.user('USER_NOT_FOUND');
      return;
    }

    // Generate authentication options
    const authnOptions = await fido2.assertionOptions();
    const challenge = base64url.encode(authnOptions.challenge);
    authnOptions.challenge = challenge;
    authnOptions.allowCredentials = [{
      type: 'public-key',
      id: passkey.credential.credentialId,
      transports: ['usb', 'ble', 'nfc', 'internal'],
    }];
    const key = uniqueId();
    Challenges.set(key, challenge);
    this.output.data({ key, authnOptions });
  }

  /**
   * 
   */
  async authenticate() {
    const { id, rawId, response, type, key } = this.input.data();

    try {
      const { clientDataJSON, authenticatorData, signature, userHandle } = response;

      // Decode userId and get stored credentials
      const userId = base64url.decode(userHandle || id);
      const challenge = Challenges.get(key);
      Challenges.delete(key);

      const passkey = await this.yp.await_proc('passkey_get', this.uid);

      // Verify the assertion (authentication)
      const assertionResult = await fido2.assertionResult({
        id,
        rawId,
        response: {
          clientDataJSON,
          authenticatorData,
          signature,
        },
        type,
      }, {
        challenge,
        origin,
        publicKey: passkey.publicKey,
        prevCounter: passkey.counter,
        userHandle: userHandle || id,
      });

      // Update counter for replay attack protection
      passkey.counter = assertionResult.authnrData.counter;
      await this.yp.await_proc('passkey_store', userId, passkey);
      this.output.data({ status: Attr.ok })
    } catch (error) {
      console.error('Error authenticating credential:', error);
      this.exception.server("AUTHENTICATION_FAILED")
    }

  }

}

module.exports = Passkey;
