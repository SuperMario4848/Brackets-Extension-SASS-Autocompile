/*
The MIT License (MIT)

Copyright (c) 2018 SuperMario4848

!!!
The complete Sass-Compiler, that is used in this plugin, is from this source, also published with the MIT-License: https://github.com/medialize/sass.js
Authors: 
    Christian Kruse - @cjk101010
    Sebastian Golasch - @asciidisco
    Rodney Rehm - @rodneyrehm
!!!

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/


define(function (require, exports, module) {

    var commandManager = brackets.getModule("command/CommandManager");
    var menus = brackets.getModule("command/Menus");
    var appInit = brackets.getModule("utils/AppInit");
    var dialogs = brackets.getModule("widgets/Dialogs");
    var defaultDialogs = brackets.getModule("widgets/DefaultDialogs");
    var fs = brackets.getModule("filesystem/FileSystem");
    var fse = brackets.getModule("filesystem/Directory");
    var kbm = brackets.getModule("command/KeyBindingManager");
    var docMan = brackets.getModule("document/DocumentManager");
    var projectMan = brackets.getModule("project/ProjectManager");
    var fse1;
    var sass = require("./myCompiler");

    var SOURCE_SELECTION = "sourceSCSS.select";
    var DESTINATION_SELECTION = "destinationCSS.select";
    var ENABLE_AUTOCOMPILE = "autocompile.activate";
    var START_COMPILE = "sassCompile.execute";
    var TOP_MENU = "topMenu.select";

    var sourceFile = "";
    var destinationFile = "";
    var projectRoot = "";

    var fileEntries = [];
    var files = [];
    var output;

    function log(s) {
        console.log(s)
    }

    function log2(title, message) {
        dialogs.showModalDialog(defaultDialogs.DIALOG_ID_INFO, title, message);
    }

    function handleSourceSelection() {
        fs.showOpenDialog(false, true, "Select Source SCSS", projectMan.getProjectRoot().fullPath, "", saveSource);
    }

    function saveSource(fail, dir) {
        sourceFile = dir[0];
        log(sourceFile);
    }

    function saveDestination(fail, dir) {
        destinationFile = dir;
        log(destinationFile);
    }

    function saveOutput(result) {
        log(result);
        var status = result.status;
        if (status === 0) {
            output = result.text;
            var cssFile = fs.getFileForPath(destinationFile);
            log(cssFile);
            log(output);
            var options = {
                blind: "blind"
            };
            cssFile.write(output, options, log);
        } else {
            if (status === 1) {
                log("Compilation Error, Syntax!");
                log2("Compiler Error", "Woops, something went wrong: " + result.formatted);
            } else {
                log("Compilation Error, no main File!");
                log2("Compiler Error", "Woops, something went wrong: No main File found!");
            }
        }
    }

    function handleDestinationSelection() {
        fs.showSaveDialog("Select CSS Save Location", projectMan.getProjectRoot().fullPath, "main.css", saveDestination);
    }

    function register() {
        projectRoot = projectMan.getProjectRoot().fullPath;
        commandManager.register("Select Source Folder", SOURCE_SELECTION, handleSourceSelection);
        commandManager.register("Select Destination Folder", DESTINATION_SELECTION, handleDestinationSelection);
        commandManager.register("Enable AutoCompile", ENABLE_AUTOCOMPILE, handleCompilerActivation);
        commandManager.register("Start Compile", START_COMPILE, startCompile);
        docMan.on("documentSaved", startCompile);
        projectMan.on("projectClose", reset);


        kbm.addBinding(START_COMPILE, "Alt-F");

        var top_menu = menus.addMenu("Sass Compiler", TOP_MENU);

        top_menu.addMenuItem(SOURCE_SELECTION);
        top_menu.addMenuItem(DESTINATION_SELECTION);
        top_menu.addMenuItem(ENABLE_AUTOCOMPILE);
    }

    function reset() {
        sourceFile = "";
        destinationFile = "";
        log("Compiler inactive");
        if (commandManager.get(ENABLE_AUTOCOMPILE).getChecked(true)) {
            commandManager.get(ENABLE_AUTOCOMPILE).setChecked(false);
            log2("Information", "Compiler inactive");
        }
    }

    function handleCompilerActivation() {
        if (commandManager.get(ENABLE_AUTOCOMPILE).getChecked(true)) {
            commandManager.get(ENABLE_AUTOCOMPILE).setChecked(false);
            log("Compiler inactive");
            log2("Information", "Compiler inactive");
        } else {
            projectRoot = projectMan.getProjectRoot().fullPath;
            if (sourceFile != "" && destinationFile != "") {
                commandManager.get(ENABLE_AUTOCOMPILE).setChecked(true);
                fse1 = fs.getDirectoryForPath(sourceFile);
                log(fse1.fullPath);
                log("Compiler ready to compile at Save or press Alt+F for manual compile!");
                log2("Information", "Compiler ready to compile at Save or press Alt+F for manual compile!");
            } else {
                log("Failed to activate. Source or destination not defined");
                log2("Configuration Error", "Wooops: Failed to activate. Source or destination not defined");
            }
        }
    }

    function startCompile() {
        if (commandManager.get(ENABLE_AUTOCOMPILE).getChecked(true)) {
            fs.clearAllCaches();
            fileEntries.splice(0, fileEntries.length);
            files.splice(0, files.length);
            fse1.getContents(readFiles);
        }
    }

    function readFiles(str, fileArray, str2array) {
        files = fileArray;
        for (var i = 0; i < files.length; i++) {
            files[i].read(getText);
        }
    }

    function getText(str1, str2, str3) {
        log(str2);
        fileEntries.push(str2);
        log(fileEntries[fileEntries.length]);
        if (fileEntries.length === files.length) {
            log("filereading complete");
            sass.myCompile(files, fileEntries, log, saveOutput);
        }
    }


    function init() {
        register();
    }

    appInit.appReady(init);
});
