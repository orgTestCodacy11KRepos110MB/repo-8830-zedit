ngapp.service('progressService', function($q) {
    let service = this,
        originalAlert = window.alert,
        originalConfirm = window.confirm,
        closed;

    // helper functions
    let hideFunctions = function() {
        try {
            window.alert = () => {};
            window.confirm = () => {};
            logger.addCallback('error', service.progressError);
        } catch(x) {}
    };

    let restoreFunctions = function() {
        try {
            window.alert = originalAlert;
            window.confirm = originalConfirm;
            logger.removeCallback('error', service.progressError);
        } catch(x) {}
    };

    // api functions
    this.showProgress = function(progress) {
        closed = $q.defer();
        hideFunctions();
        ipcRenderer.send('show-progress', progress);
    };

    this.hideProgress = function() {
        ipcRenderer.send('hide-progress');
    };

    this.logMessage = function(message, level = 0) {
        ipcRenderer.send('log-message', [message, level]);
    };

    this.progressMessage = function(message) {
        ipcRenderer.send('progress-message', message);
    };

    this.progressError = function(message) {
        ipcRenderer.send('progress-error', message);
    };

    this.addProgress = function(num) {
        ipcRenderer.send('add-progress', num);
    };

    this.progressTitle = function(title) {
        ipcRenderer.send('progress-title', title);
    };

    this.allowClose = function() {
        ipcRenderer.send('allow-close');
    };

    this.onProgressClosed = (callback) => closed.then(callback);

    ipcRenderer.on('progress-hidden', function() {
        closed.resolve(true);
        restoreFunctions();
    });
});

ngapp.run(function(interApiService, progressService) {
    interApiService.publish('zeditScripting', {
        LogMessage: progressService.logMessage,
        ProgressMessage: progressService.progressMessage,
        AddProgress: progressService.addProgress,
        ProgressTitle: progressService.progressTitle
    });
});
