-------------------------------------------------------------------------system.js
System()                                       #主系統
    .running_apps=[]                           #正在執行的應用程式
    .winmanagers=[]                            #所有的"應用視窗管理員"
    
    .screen                                    #Frame物件，位於body上
    .now_winmanager                            #目前畫面的"應用視窗管理員"

    .launch(software_func=null,wid=null)       #利用函數啟動某個應用，wid:指定的視窗識別，沒有的化會自動產生
    .install(app_path,software_func)           #安裝函數到某路徑
    .uninstall(app_path)                       #解除安裝某路徑的函數

App(system)                                    #應用程式
    ._system                                   #系統
    .window                                    #AppWindow類別，該App的視窗
    .handler                                   #AppWindowHandler類別

    .setMenu(paramlist,_style)                 #設定當前右鍵選單
    .setIcon(src)                              #設定icon
-------------------------------------------------------------------------windows.js
WinManager(system)                             #應用視窗管理員
    ._system                                   #主系統
    .container                                 #Frame物件，位於system的screen上
    
    .window                                    #Panel物件，位於container上，
                                                AppWindow的視窗在此之上，不可超出
    .workbar                                   #FlexTube物件，位於container上，為工作列，包含:
                                                    "開始"
                                                    所有AppWindiwHandler按鈕
                                                    "小工具"
                                                    "時間"
    .close(wid)
    .newAppWindow(wid=)

AppWindowHandler(winmanager,ico)               #Button物件，位於WinManager的workbar的movableTube上
                                                透過使用者操作，控制AppWindow:
                                                    "最小化"
                                                    "顯示"
                                                    右鍵選單
    .menu                                      #選單

    .setMenu(paramlist,_style)                 #設定當前右鍵選單
    .setIcon(src)                              #設定icon
AppWindow                                      #ResizeObj物件，位於WinManager的window上
    .manager

    .controlbar                                #視窗上的控制列:
                                                    "最小化"
                                                    "最大化"
                                                    "取消最大化"
                                                    "關閉"
    .content                                   #Frame物件，為視窗控制列下方內容區塊
