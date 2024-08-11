For each sessions, the router will execute the requested service only when it receive the signal _e.granted. See src/router.coffee. The signal is triggered by core/acl, when requested permission match user's privilege. Otherways, a signal _e.denied shall be triggered instead.
 
All servicing object must inherit from core/acl. Since core/acl needs to know who is requesting service and what is being requested, the servicing object must inherit also from core/entity.

Beside this basic behavior, core/entity has some special properties :
**_start_with**
**before_granting**

In module service/media, we have
**_start_with**        = 'mfs_home'
**before_granting**    = 'check_sanity'  or **option checker**

**_start_with** must be a stored procedure name. When set, the procedure will be called by acl and the returned data is applied to the object, actually mfs. After that, acl_check procedure is executed before triggering _e.granted or _e.denied  

**before_granting** mus be a method name of the servicing object. When set, the router will execute the function and wait for the signal **before_granting + '-done'** signal before executing the service.
 
**before_granting** can be custumized in service with the thrird argument

== FOR EXAMPLE ==
=================
private           :
  module          : require('../service/private/media')
  services        :
    check_media_child_exist : ['check_media_child_exist', privilege.manage]
    check_media_root_exist  : ['check_media_root_exist', privilege.manage]
    comment                 : ['comment', privilege.update]
    copy                    : ['copy_media',privilege.manage]
    delete                  : ['delete_media', privilege.manage]
    empty_bin               : ['empty_bin', privilege.manage]
    purge                   : ['purge', privilege.manage]
    get_filenames           : ['get_filenames', privilege.manage]
    get_media_attributes    : ['get_media_attributes', privilege.update]
    get_root_conflict       : ['get_root_conflict', privilege.update]
    make_dir                : ['make_dir', privilege.manage]
    move                    : ['move_media', privilege.manage, {checker:'pre_move'}]

Here, we can make additionnal checks in addition of check_sanity through the services table (router/services). The option {checker:"pre_move"} will ask the servicing object to run the method **pre_move** prior to executiting service **media.move**
In the method **pre_move** everything / checks shall be done… So that, when executing service, it would be simpler.