import { defaultDict } from "../tool.js";
import { Frame } from "../ui/base.js";
import { Folder } from "./built-in.js";
import { WinManager } from "./windows.js";
class FileTree{
    constructor(){
        this._data={
            'user':{
                'name':{
                    'desktop':{},
                    'downloads':{},
                    'documents':{}
                }
            }
        }
    }
    mkdir(){}
    getpath(path){}
    save(path,obj){}
    listdir(path=null){}
}

export class System{
    constructor(){
        //-----------------------------------應用
        this.apps=[];
        //----------------------------------------------視窗
        this.screen=new Frame(-1,[0,0],['100%','100%'],{'background-color':'black'});
        this.winmanagers=[];
        this.now_winmanager=new WinManager(this);
        this._hid=0;     //視窗handler識別
        this.filetree=new FileTree();
        //----------------------------------------------安裝預設程序
        //this.installApp('user/name/desktop/folder',Folder);
        //this.packagedApp(Folder,{'icon':'folder'});
        this.launch(Folder,null,{'icon':'folder'});
    }
    launch(running_func,params=null,config=null){
        let app=new App(this,running_func,config);
        app.run(params);
    }
    installApp(app_path,software_func,config){
        let app=new App(this,running_func,config);
        this.filetree.save(app_path,app);
        this.now_winmanager.update_desktop();
        return app;
    }
    //=============================================================================
    //-------------------------------------------------------------------各種api功能
    newAppWindow(app){
        if(app.hid==undefined){
            this._hid++;
            app.hid=this._hid;
        }
        let appwindow=this.now_winmanager.newAppWindow(app);
        return appwindow;
    }
}


export class App{
    constructor(system,running_func=null,config=null){
        config=defaultDict(config,{'icon':'exe'});
        //--------------------------------------------
        this._system=system;
        this.running_func=running_func;
        this.config=config;
        //--------------------------------------
        this.icon=config['icon'];
    }
    //--------------------------------------------釘選
    pintoTaskBar(){}
    pintoStart(){}
    //--------------------------------------------呼叫系統
    callSystem(cmd){
        switch (cmd){
            case 'new window':
//                config=defaultDict(this.config,{'icon':this.icon});
                let appwindow=this._system.newAppWindow(this);
                return appwindow;
            case 'open file':
                return;
            case 'listdir':
                return;
        }
    }
    //----------------------------------------------執行
    run(params=null){
        let app=this;
        function api(cmd){
            return app.callSystem(cmd);
        }
        this.running_func(api,params);
    }
}
