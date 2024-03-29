import { ipcRenderer } from 'electron';
import './polyfills';

// angular app initialization
const ngapp = angular.module('progress', ['vs-repeat', 'luegg.directives', 'angularSpinner']);

//== begin angular assets ==
//=include Directives/progressBar.js
//=include Directives/progressModal.js
//=include Directives/loader.js
//=include Factories/spinnerFactory.js
//=include Services/modalService.js
//== end angular assets ==

ngapp.run(function($rootScope, spinnerFactory) {
    // initialization
    let themeStylesheet = document.getElementById('theme');
    $rootScope.spinnerOpts = spinnerFactory.inverseOptions;
    $rootScope.progress = {
        determinate: false,
        message: '...'
    };

    // event handlers
    $rootScope.$on('closeModal', () => {
        if ($rootScope.progress.canClose) ipcRenderer.send('hide-progress');
    });

    ipcRenderer.on('set-theme', function(e, payload) {
        themeStylesheet.href = payload;
    });

    ipcRenderer.on('set-progress', (e, payload) => {
        if (!payload) return;
        $rootScope.$applyAsync(() => $rootScope.progress = payload);
    });

    ipcRenderer.on('allow-close', () => {
        $rootScope.$applyAsync(() => $rootScope.progress.canClose = true);
    });

    ipcRenderer.on('progress-title', (e, payload) => {
        $rootScope.$applyAsync(() => $rootScope.progress.title = payload);
    });

    ipcRenderer.on('progress-message', (e, payload) => {
        $rootScope.$applyAsync(() => $rootScope.progress.message = payload);
    });

    ipcRenderer.on('progress-error', (e, payload) => {
        alert(payload);
        $rootScope.$applyAsync(() => $rootScope.progress.error = true);
    });

    ipcRenderer.on('add-progress', (e, payload) => {
        $rootScope.$applyAsync(() => {
            let p = $rootScope.progress;
            p.current += payload;
            if (p.current === p.max) p.complete = true;
        });
    });

    ipcRenderer.on('log-message', (e, payload) => {
        if (!$rootScope.progress.log) return;
        $rootScope.$applyAsync(() => {
            $rootScope.progress.log.push({
                message: payload[0],
                level: payload[1]
            });
        });
    });
});
