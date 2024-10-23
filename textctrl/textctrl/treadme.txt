------------------------------------------------------------------------tool.js  提供文字轉換、css布局、javascript加載、html版面工具
copy_dict(dict)                           #複製字典
convert_c(c)                              #將任意字元轉化為html合格字元
convert_string(string)                    #將任意字串轉化為html合格字串
add_css(css)                              #在 header 新增css
add_script(src)                           #加載某位址的 javascript
HtmlElement(tag,firstline,innerHTML)      #快速建立 HTML 物件
VoidElement(length)                       #當作空白使用，length為元素長度(px)
------------------------------------------------------------------------telement.js    可創建[任意]元素，任何想插入textctrl的東西都要轉化為
                                                                                       TElement，內建「換行」與「字元」 屬性
TElement(build_dict)                      #基底通用型態
    .bdict
        'type':'xxx'
         'bgcolor':'transparent', //背景顏色

         //-------------------------以下為非預設屬性
         'scale':'w,h',           //縮放比例
         'rotate':int,            //旋轉角度
         'B':bool,                //粗體
         'I':bool,                //斜體
         'U':bool,                //下底線
         'S':bool,                //中橫線
         'fontSize':int,          //字大小
         'fontFamily':str         //字型
         'color':color            //文字顏色
    .type                                 #型態
    .container                            #包裝整個物件的元素
    .debug()                              #偵錯模式(有框線)
    .update()                             #個別型態有不同的載入方法
    .select(bool)                         #被選定時，背景顏色變化
    .get_rect()                           #獲取相對於displayer的[x,y,w,h]
    .get_abs_rect()                       #獲取相對於body的[x,y,w,h]
    .transform('rotate',deg)              #使自身旋轉
    .transform('scale'.scale)             #拉縮自身
    .transformup()                        #結算變形旋轉
    .copy()                               #複製自身
    .ToString()                           #自身的儲存字串
    
  
以下繼承TElement
Br                                        #換行物件
    .bdict={
        
    }
Line_space                                #行距
    .bdict={
        
    }
Char                                      #一般字元
    .bdict={
       'char':'x'
    }
------------------------------------------------------------------------extelement.js   繼承 TElement，自定義元素並擴充
Text
    .bdict={
        'text':'.....'
    }
Image
    .bdict={
        'src':'.....'
    }
Link
    .bdict={
        'text':'.....'
        'href':'.....'
    }
Table
    .bdict={
        'ranks':'r,c'
    }
Html                                      #任意html物件
    .bdict={
        'type':'html',
        'code':'html code'
    }
-------------------------------------------------------------------------------------------tmodel.js    為一個能排列 telement 並展示的[文字方塊]
TModel(tcontrol,element_obj,unit=30)      #unit為 char 的字型基礎大小(px)
    function
        render_selection()                #渲染選擇區塊
        copy_selection()                  #複製選擇區的資料為「字串」、「字典元素」
        
    .element_obj                          #任意可依賴的document元素
        .onmousedown
        .onmousemove
        .onmouseup
        .onclick
        .ondblclick
    .telements                            #list，裡面內容都是 TElement 元素
    .displayer                            #<div>，其children為TElement 轉化後的document元素
                                          ※基本上.telements的長度與.displayer.children 的長度一樣長
                                            在輸入模式下，.displayer.children會多出兩個物件:.inp和._inp

    .index                                #當前指標位置
    .selecting=[0,0]                      #選擇位置
    .input_mode='chars'                   #當前輸入模式
    .input_input_funcs={                  #各種輸入模式對應到的function
        'chars':this.insert_chars
    }
    .inp                                  #輸入框，position為absolute
        .addEventListener
            'paste'
            'keydown'
            'input'
            'keyup'
    ._inp                                 #顯示.inp輸入的內容，並被insert進.displayer.children中佔空間
    -----------------------------------------------------------------------#以上都在constructor
    .mousetap(event)                      #將event轉為相對座標再tap
    .tap(x,y)                             #點擊到哪個元素?點擊後index在哪?
    .show_inp()                           #顯示閃爍輸入
    .remove_inp()                         #移除輸入點

    .change_line()                        #換行，加入br與line_space

    .inherit_dict(dtype,index=null)       #在index前搜尋某dtype屬性繼承
    .inherit_text_dict(index=null)        #繼承前一個text屬性

    .update_align()                       #更新對齊位置
    ------------------------------------------------------------------------#以下為外接語法
    .zoom(zoom)                            #改變unit，進行文字方塊縮放
    .delete(index=null,index2=null)        #刪除某單元或一個範圍

    .set_align(align)                      #設定對齊，align=left,center,right
    .set_attr(mdict)                       #修改某範圍內telement的屬性
    .insert_telement_by_dict(bdict)        #將字典轉化為telement再插入
    .insert_telement(Telement)             #插入某 telement 或其繼承者
    .insert_chars(chars,mdict)             #插入字元串

    .back()                                #上一步
    .forward()                             #下一步

    .ToString()                            #將 .telements 全部轉化為儲存字串(json)
    .load(json_string)                     #載入之前轉化成的字串
------------------------------------------------------------------------------------------------extmodel.js  繼承tmodel，定義插入的其他元素
ExTModel(tcontrol,element_obj)
    .insert_text(text_string,mdict=null)          #插入文字，mdict是除此之外要加入的屬性，文字會自動繼承先前屬性
    .insert_image(src,width=null,height=null)     #插入圖片
    .insert_link(href,name)                       #插入連結
    .insert_table(row,col)                        #插入表格
    .insert_html(html_code)                       #插入html
-----------------------------------------------------------------------------------auxiliary.js   提供默認面板工具給使用者
Resizer(tcontrol)                         #元素造型調整(8方位點+1旋轉)
    .telement                             #選定的 telement
    .resize(size)                         #調整尺寸、選轉

CustomMenu(tcontrol)                      #右鍵選單
    .customMenu                           #插入其他元件選單，在沒有任何東西被選取時觸發
    .customMenu2                          #對選取元件做操作

SelectionBox(tcontrol)                    #當元素被選取時，浮現在滑鼠旁邊的快速樣式選單
--------------------------------------------------------------------------------customize.js  繼承extelement 與 extmodel，自定義更多功能
自定義元素:
    EPS(build_dict)
自定義模型:
    CTModel(tcontrol,element_obj)
自定義 ui 按鈕內容
-------------------------------------------------------------------------------------------tcontrol.js   能夠管理多個文字方塊、整合這些文字方塊
TControl(element_obj)
    .tmodel                               #目前focus的tmodel
    .tmodels                              #dict，內容有所有的tmodel
    .key                                  #int ，每新增一個tmodel就+1
-------------------------------------------------------------------------------------------textctrl.js    Tcontrol外接方法的簡潔統整
Textctrl(element_obj)
    .back()
    .forward()

    .set_size(w=null,h=null)
    .set_align(align)                     #設定對齊  align=left,center,right
    .set_attr(attr_dict)                  #為被選擇的物件設定屬性

    .input_text(text_string)
    .insert_image()                       
    .insert_text()
    .insert_table()
    .insert_link()
    .insert_html()

    .to_text()
    .to_image()
    .to_eps()
    .to_html()
    .to_pdf()

    .save()
    .load()
---------------------------------------------------------------------------------------------------------依賴關係



           extelement.js —→ extmodel.js  
                ↑               ↑        ╲ 
                ｜               ｜          ↘ 
tool.js —→ telement.js —→   tmodel.js  —→  customize.js —→ tcontrol.js —→ textctrl.js
        ╲                                     ↗ 
          ↘                                 ╱ 
             ui.js  ————————————









