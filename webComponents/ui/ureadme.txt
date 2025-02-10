-----------------------------------------------------------------base.js       基礎元件元素
defaultStyle(style=null,_style=null)          #函數，將_style有但style沒有的屬性加入style
                                               過程只改變_style並回傳，用於設置初始元件物件

Base(tag,parent,pos,size,_style)              #所有面板元素的基礎基底
                                               parent為base.js內的原件類別，值為-1時，加入body中
    ._element                                 #自身元素，外部請勿調用
    ._style                                   #字典，有自身element的所有屬性
    ._enable                                  #是否啟用(與使用者互動)
    .parent                                   #父層元件，-1代表是body
    .children                                 #自身的子元件
    .type='base'                              #型態
    
    ------------------------------------------#document element基本功能
    .appendChild(child)                       #添加子元件
    .removeChild(child)                       #移除子元件
    .addEventListener(eventname,callback)     #為element添加某類型事件

    ------------------------------------------#外觀
    .setStyle(_dict=null)                     #設定屬性並儲存(請勿直接調用_element設定)
        'background-color':value        
        'font-size':value
        ...
    .setTemStyle(_style)                      #設定屬性但不儲存，之後可用setStyle()復原

    .getrect()                                #獲取相對於父元素的[x,y,w,h]
    .getabsrect()                             #獲取相對於視窗的[x,y,w,h]

    .show(pos=null)                           #顯示，可額外定位
    .hide()                                   #隱藏自身

    .setPos(pos)                              #設定自身座標
    .move(offset)                             #移動位置
    .setAlign(                                #讓自身置於相對於父元素的位置
        hr=null,                               hr='left','center','right'
        vr=null)                               vr='top','center','bottom'

    .setSize(size)                            #設定尺寸
    .fixedSize()                              #將自身尺寸轉化為"px"固定
    ------------------------------------------#父層依賴
    .setParent(parent)                        #從原本的父元素離開，設定新父元素並加入
    .getFrame()                               #回傳其「頂層依賴」，type為Frame或parent為-1的物件
    .getParents()                             #獲取所有比自己頂層的父層元件
    ------------------------------------------#事件
    .stopPropagation(eventname)               #設定當自身接收到某事件時，禁止冒泡到父層元件
    .enable(_enable=true)                     #若不啟用:hover、各種點擊輸入事件不會響應
    
    ._enableHover()                           #啟動hover
    ._disableHover()                          #取消hover
    .setHover(_style,                         #設定hover時的屬性並啟動，當鼠標離開元素，移動至其「頂層依賴」時解除
              hover_event=null,                hover時觸發的事件
              domain=null)                     hover的作用面板，鼠標離開此域hover就會無效，預設為其「頂層依賴」
    
    .bindContextMenu(custMenu,name)           #右鍵點擊時，呼叫選單

Panel(parent,pos,size,_style)                 #繼承Base，面板
    .element                                  #背景div元素
    .type='panel'

    .loadHTML(html)                           #載入html至面板
    .addEvent(eventname,callback)             #添加事件
    .delEvent(eventname,callback)             #刪除事件
        
Frame(parent,pos,size,_style)                 #繼承Panel，視為可縮放移動的 body
                                               當自身被點擊時，自動關閉所有子層的contextmenu
    .type='frame'

body                                          #Frame物件，作為body使用，自身有滾動條，元素parent為-1時加入

Label(parent,label,pos,size,_style)           #繼承Base，一般標籤
    .element                                  #文字span元素
    .label
    .type='label'

    .setLabel(label)                          #更改標籤

DefaultButton(parent,label,                   #繼承Base，為html的普通按鈕
              onclick=null,pos,
              size=null,_style=null)
    .element                                  #按鈕button元素
    .label                                    #按鈕上文字
    .type='defaultbutton'

    .setLabel(label)                          #更改標籤

Button(parent,label,onclick,pos,size,_style)  #繼承DefaultButton，無預設邊框的自訂按鈕
    .type='button'

SwitchButton(parent,label,                    #繼承Button，點擊時在on與off狀態切換
             onEvent,offEvent,                #on事件發生的func，off事件發生的func
             switch_style=null,               #on事件發生時按鈕的外觀變化
             pos=null,size=null,_style=null)
    .switch                                   #代表當前on與off狀態
    .type='switchbutton'

    .setSwitch(_switch,event=null)            #設定當前on與off狀態，傳入event時，觸發自身對應的點擊事件

DropdownButton(parent,label,                  #繼承SwitchButton，在on狀態時在按鈕下方出現下拉式選單，off時隱藏
                                               當頂層frame被點擊時，下拉式選單自動關閉，自身切換為off狀態
               dropdown_style=null,           #on事件發生時按鈕的外觀變化
               pos=null,size=null,_style=null)
    ._menu                                    #自身的選單
    .type='dropdownbutton'

    .setMainMenu(paramsList,_style=null)      #設定主選單內容
    .addMenu(layer,menu_name,                  用於添加次選單
             paramsList,_style=null)

ColorButton(parent,label,                     #繼承Button，選擇顏色按鈕
             choose_event,                    #當某顏色被選定時，傳入此函數
             pos,size,_style)
    .type='colorbutton'

Select(parent,value_list,pos,size,_style)     #繼承Base，選項欄位
    .element                                  #選項select元素
    .type='select'

ContextMenu(parent,                           #右鍵選單
         item_size,                           #單條列大小
         item_style                           #單條列屬性
    .menus=[{},{},{}]                         #菜單列(預設3欄)
    .showing=false                            #當前顯示狀態
    .events={'show':[],'hide':[]};            #自身事件，自身顯示時，觸發show中所有事件;
                                                        自身隱藏時，觸發hide中所有事件
    ------------------------------------------#添加選單
    .addMenu(layer,menu_name,paramsList)      #添加菜單，layer:代表層, menu_name:

    ------------------------------------------#事件
    .enable(layer,menu_name,btn_name,_enable) #設定某個選項的enable
    .addEvent(eventname,callback)             #添加事件
    .delEvent(eventname,callback)             #刪除事件
    ------------------------------------------#顯示與隱藏
    .show(name,event)                         #用在點擊事件，鼠標旁顯示菜單
    .show_below(name,obj)                     #將自身顯示在某個物件下方
    .show_at(name,pos,event=null)             #用在按鈕事件，在絕對位置顯示菜單
    .hide(menu=0)                             #隱藏菜單
)

-----------------------------------------------------------------widget.js    進階面板工具
Tube(parent,pos,size,_style)                  #繼承Base，一條橫向管子，可左中右插入元件
    .element                                  #容器div元素
    .objs=[[],[],[]]                          #左中右所插入的物件
    .interval=5                               #元件之間的距離
    .type='tube'

    .add_item(obj,loc='left',                 #插入元件，無視元件X座標屬性放入，loc='left','center','right'
              offset=[0,0])                   #offset:加入物件的水平與垂直的額外擴充
    
    .fitParent()                              #使自身符合parent大小
    .setWidth(width)                          #高度不變，設定寬度
    .setSize(size)                            #重新設定大小

        
NavBar(parent,_style)                         #繼承Tube，上排工作列
    .type='navbar'        
        
WorkBar(parent,_style)                        #繼承Tube，下排工作列
    .type='workbar'        

Modal(parent,title,size,                      #繼承Frame，模態內容
        check_func=null)                      #確認按鈕的觸發事件，null則無此按鈕
    ._container=container                     #容器，包含header、body、footer，勿直接調用
    .header                                   #標題，為NavBar
    .body                                     #內容，為Panel
    .footer                                   #尾部，為WorkBar

    .loadHTML(html)                           #載入html至內容
    .launch()                                 #啟動modal

DragObj(parent,pos,size,_style=null)          #繼承Panel，可拖動物件
    .bind_objs=[]                             #當自身被拖動時，跟著一起被拖動的物件
    ._lock_setting=[false,false]              #用於鎖定水平與垂直方向是否可拖動
    .limit=false                              #當limit為true時，此物件只能在parent內的範圍被拖動
    .type='dragobj'

    .bind(obj)                                #綁定物件
    .lock(hr=false,vr=false)                  #對水平或垂直方向進行鎖定

ResizeObj(parent,                             #繼承Panel，可由滑鼠拖動8個方向進行縮放
          side=5,                             #拖動區塊大小
          pos,                                #container的座標
          size,                               #自身的大小
          _style=null)
    .container                                #為panel，周邊有8個拖動區塊，中間是自身
    .side                                     #拖動區塊大小
    .btns=[...]                               #對應到8個感應拖動區塊的元件
    .events['resize']=[]                      #當自身大小被改變時，觸發所有resize事件，傳入自身大小作為參數

widget(widgetName,                            #用來快速建構某元件的函數，widgetName為類別名稱
       params,                                #該元件類別被創立時的參數
       config=null)                           #為字典，是該元件的額外設定
                                               例如 ['hover']=[...] 將直接呼叫該元件的setHover子函數並投入字典值參數
-----------------------------------------------------------------extendbar.js
Bar(extendbar,path,onclick,unclick)   #一列bar, extendbar:主操控版, path:此bar代表的路徑
                                       onclick:此bar被點擊時觸發, 
                                       unclick，此bar被點擊後，其他bar被點擊時觸發
    .label                            #div物件，顯示自身名條和其他按鈕提示符
    .data                             #String，代表自身資料

    .get_path()                       #獲取此bar代表路徑
    .insert_label_item(key,           #在label添加其他物件，key:代表名稱
                       element,       #element:html任意元素
                       index=null)    #index:插在label的哪一個位置
    
    .delete()                         #將自身從extendbar中刪除
    .rename(name)                     #重新命名此標籤
    .hide_label()                     #在extendbar中隱藏自身
    
    .focus()                          #在extendbar中鎖定自身
    .unfocus()                        #取消自身被鎖定狀態
    
    .onclick(event)                   #自身被點擊時觸發(滑鼠左鍵)
    .unclick()                        #自身原被選擇，但被取消選擇時觸發

    .ToString()                       #自身的 Bar字串
    .LoadString(BString)              #空bar載入 Bar字串 後，會變回此字串描述狀態

FolderBar(extendbar,path,             #繼承Bar，作為資料夾
          onclick=null,unclick=null,  #onclick,unclcik:作為資料夾內檔案屬性
          barstring='')               #barstring:可載入資料夾內容清單資料
    .expand_status=false;             #當前展開狀態
    .listdir={};                      # 內部檔案名稱:檔案Bar
    .type='folder'                    #自身型態

    .focus()                          #將extendbar的folderpath設定為自身
    .onclick(event)                   #切換自身開啟閉合狀態
    
    .add_folder(folderpath,           #在自身內部新增資料夾
                bar_onclick=null,
                bar_unclick=null)
    .add_file(filepath,data='')       #在自身內部新增檔案

    .getbar(path,createfolder=false)  #獲取某路徑的bar，createfolder:若該路徑不存在，是否強制建立
    .expand(expand=null)              #指定自身為開啟還是閉合
    
    .set_data(path,data)              #設定某路徑資料
    .get_data(path)                   #獲取某路徑data
    .ToString()
    .LoadString(BString)

FileBar(extendbar,path='',            #繼承Bar，作為檔案
        onclick=null,unclick=null,    #自身被點擊與被退出事件
        data='')                      #自身資料

    .focus()                          #將extendbar的folderpath設定為自身父資料夾        
    .onclick(event)                   #觸發自身被點擊事件
    .unclick()                        #自身被退出事件

ExtendBar(parent,pos,size)            #parent:Panel物件
    .folderpath                       #要額外新增內容的資料夾路徑
    .nowpath                          #當前鎖定路徑
    .input_div                        #div元素，為輸入框，在資料夾下新增欄位時會顯示

    .close_input()                    #關閉輸入框
    .new_input(folderpath,callback)   #在指定資料夾下顯示輸入框，輸入後將值傳給callback

    .set_addfolder_btn(path,          #為某bar新增「可新增資料夾的按鈕」
                    bar_onclick=null, #新增資料夾時的屬性
                    bar_unclick=null, #新增資料夾時的屬性
                    run=false)        #當run為true時，直接觸發該「可新增資料夾的按鈕」的點擊事件
    .set_addfile_btn(path,            #為某bar新增「可新增檔案的按鈕」
                  newfile_event=null, #當檔案被創立時，首次初始化的事件
                  run=false)          #當run為true時，直接觸發該「可新增檔案的按鈕」的點擊事件

    .set_download_btn(path)           #為某bar新增「可下載 bar字串 的按鈕」，會將 bar字串 儲存到本機
    .set_btn(path,img_src,callback)   #為某個bar右方新增新功能圖標，該圖標被點擊時觸發callback