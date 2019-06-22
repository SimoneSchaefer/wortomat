/*!
 * froala_editor v3.0.0 (https://www.froala.com/wysiwyg-editor)
 * License https://froala.com/wysiwyg-editor/terms/
 * Copyright 2014-2019 Froala Labs
 */

(function (FroalaEditor) {
    // Add an option for your plugin.
    FroalaEditor.DEFAULTS = Object.assign(FroalaEditor.DEFAULTS, {
      myOption: false
    });
  
    // Define the plugin.
    // The editor parameter is the current instance.
    FroalaEditor.PLUGINS.myPlugin = function (editor) {
      // Private variable visible only inside the plugin scope.
      var private_var = 'My awesome plugin';
  
      // Private method that is visible only inside plugin scope.
      function _privateMethod () {
        console.log (private_var);
      }
  
      // Public method that is visible in the instance scope.
      function publicMethod () {
        console.log (_privateMethod());
      }
  
      // The start point for your plugin.
      function _init () {
        // You can access any option from documentation or your custom options.
        console.log (editor.opts.myOption)
  
        // Call any method from documentation.
        // editor.methodName(params);
  
        // You can listen to any event from documentation.
        // editor.events.add('contentChanged', function (params) {});
      }
  
      // Expose public methods. If _init is not public then the plugin won't be initialized.
      // Public method can be accessed through the editor API:
      // editor.myPlugin.publicMethod();
      return {
        _init: _init,
        publicMethod: publicMethod
      }
    }
  })();