import { UserWindow } from "./windows.js";

export class System{
    constructor(){
        this.running_apps=[];                  //正在執行的應用程式
        this.disk=null;                        //磁碟檔案
        this.userwindows=[];                      //所有的桌面
        this.now_userwindow=new UserWindow(this);        //目前桌面
    }
    launch(software_func=null){
        let app=new App(this);
        if(software_func!=null) software_func(app);
        
    }
    launchApp(app_path){}
    install(app_path,software_func){}
    uninstall(app_path){}
}

class App{
    constructor(system){
        this._system=system;
        this._userwindow=system.now_userwindow;
        this.window=this._userwindow.newAppWindow();   //在userwindow建立一個工作按鈕和視窗
        this.content=this.window.content;
    }
    //-----------------------------------------------------------視窗外觀
    setIcon(icon_src){}
    setName(name){}
    setMenu(){}
    //------------------------------------------------------------使用者介面
    minimize(){
        this._userwindow.minimize(this.window);
    }
    maximize(){
        this._userwindow.maximize(this.window);
    }
    //------------------------------------------------------------程序
    start(){}
    restart(){}
    pause(){}
    close(){}
}