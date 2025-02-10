import { Canvas, defaultStyle, getRelPos } from "../ui/base.js";
import { TElement,Char, TElementRegistry } from "./telement.js";
import { TBlock } from "./tblock.js";
import { Modal } from "../ui/widget.js";
import { defaultDict, List_to_LString, LString_to_List, NumberList } from "../tool.js";

export class TModel extends Canvas{         //這是任意形狀的 TModel
    constructor(tcontrol,pos,size,_style=null){
        _style=defaultStyle(_style,{'background':'white','cursor':'text'});
        super(tcontrol,pos,size,_style);
        this.tcontrol=tcontrol;
        //----------------------------------------------------------基本參數
        this.is_selected=false;              //是否被選擇
        this.tblocks=[];                     //所有 tblocks
        this.nowtblock=null;                 //目前 tblock
        //this.bgcolor='transparent';
        //----------------------------------------------------------登記 tmodel
        tcontrol.addTmodel(this);
        this.addEvent('destroy',()=>{
            for(let i=0;i<tmodel.tblocks.length;i++) tmodel.tblocks[i].destroy();
            tcontrol.removeTmodel(tmodel);});
        let tmodel=this;
        //---------------------------------------------------------- 滑鼠事件(視為真實點按)
        this.isFocus=false;       //是否存在 tblock 現在被 tcontrol focus 中
        this.addEvent('onmousedown',function (event){
            if(event.button==0){
                let apos=tmodel.getAbsPos();
                let relPos=[event.clientX-apos[0],event.clientY-apos[1]]; //[鼠標]相對於[自身左上角]的 pos
                for(let i=0;i<tmodel.tblocks.length;i++){
                    if(tmodel.tblocks[i].onmousedown(relPos)!=null) tmodel.nowtblock=tmodel.tblocks[i];
                }
            }
            tmodel.isFocus=tcontrol.nowtmodel==tmodel;
        });
        this.addEvent('contextmenu', function(event) {
            if(tmodel.rightclick_func!=null) tmodel.rightclick_func(event);
            tmodel.nowtblock.show_inp();
        });
        this.rightclick_func=null;
        //----------------------------------------------------------
        this.type='tmodel';
        //this.addEvent('resize',(size)=>{console.log('tmodel大小便更');});
    }
    //=====================================================================================新增 擴充
    setRightClick(func){
        this.rightclick_func=func;
    }
    //===================================================================================== Tblock 事件
    addTBlock(block,lineHeight=30,lineSpace=6){
        this.tblocks.push(new TBlock(this,block,lineHeight,lineSpace));
    }
    select(is_selected=true){
        this.is_selected=is_selected;
        for(let i=0;i<this.tblocks.length;i++) this.tblocks[i].select(is_selected);
    }
    arrange(){
        for(let i=0;i<this.tblocks.length;i++) this.tblocks[i].arrange();
    }
    //=====================================================================================渲染 自身
    getDisplayRect(){                 //目前能看見的區域
        let apos=this.getAbsPos();
        return [0,-apos[1]-200,this.size[0],1080];
    }
    renderData(rect=null){             //將自身儲存的資料結構(tblock內特定位置內容渲染出來)
        let start=performance.now();
        if(rect==null) rect=this.getDisplayRect();
        if(this.is_selected) this.drawRect(rect,'skyblue');
        else this.clearRect(rect);
        //console.log(`清空時間: ${(performance.now() - start).toFixed(3)}ms`);
        start=performance.now();
        for(let i=0;i<this.tblocks.length;i++){
            this.tblocks[i].render(rect);
        }
        //console.log(`渲染時間: ${(performance.now() - start).toFixed(3)}ms`);
    }
    //=====================================================================================儲存 與 載入
    ToTmString(){
        let teStringBox=[];
        for(let i=0;i<this.tblocks.length;i++) teStringBox.push(this.tblocks[i].ToTeString());
        return List_to_LString(teStringBox);
    }
    LoadTmString(tmString){
        let teStringBox=LString_to_List(tmString);
        for(let i=0;i<teStringBox.length;i++) this.tblocks[i].LoadTeString(teStringBox[i]);
    }
}
export class RectModel extends TModel{   //----------------------------------方形 TModel，只有一個 tblock
    constructor(tcontrol,pos,size,_style=null){
        super(tcontrol,pos,size,_style);
        this.addTBlock([0,0,this.size[0],this.size[1]]);
        this.nowtblock=this.tblocks[0];
        //------------------------------------------------------------------設置 padding
        this.padding=[0,0];
        //------------------------------------------------------------------尺寸變更事件
        let tmodel=this;
        this.addEvent('resize',(size)=>{tmodel.setPadding(tmodel.padding);});
        //------------------------------------------------------------------
        this.type='rectmodel';
    }
    setPadding(padding){
        this.nowtblock.setBlock([padding[0],padding[1],this.size[0]-padding[0]*2,this.size[1]-padding[1]*2]);
        this.padding=padding;
    }
}

export class DemoModel extends RectModel{       //一個用於展示各種 TModel 功能的物件
    constructor(tcontrol,pos,size,_style=null){
        super(tcontrol,pos,size,_style);
        let tmodel=this;
        tcontrol.addMenu(0,'demo_insert',[
            ['貼上',function (event){tmodel.nowtblock.paste();}],
            ['插入圖片',function (event){imgModal.launch();}],
        //    ['文字方塊',function (event){tmodel.insert_table(1,1);}],
        //    ['插入表格',function (event){tmodel.insert_table(5,5);}],
        //    ['屬性&ensp;&ensp;▶','file']
        ]);
        let imgModal=new Modal(this,'插入圖片',['50%',300],function (){
            let img_path=textctrl_imgpath.value.replace('\\','/');
            if(img_path!='')
            tmodel.nowtblock.insertImage(upload_src,{'dsrc':img_path});
        });
        imgModal.loadHTML(`<input placeholder="輸入圖片網址" style="width:90%;font-size:1rem;" id='textctrl_imgurl'><br/><br/><br/>
                            <input type="file" id='textctrl_imgupload'><br/><br/>
                            <label for="textctrl_imgpath">轉碼時讀取位址:</label><input id="textctrl_imgpath" style="font-size:1rem;">`)
        let textctrl_imgurl=document.getElementById('textctrl_imgurl');
        let textctrl_imgupload=document.getElementById('textctrl_imgupload');
        let textctrl_imgpath=document.getElementById('textctrl_imgpath');
        textctrl_imgurl.addEventListener('input',function (event){
            textctrl_imgpath.value=textctrl_imgurl.value;
            upload_src=textctrl_imgurl.value;
        });
        let upload_src='';
        textctrl_imgupload.addEventListener('change', function(event) {
            const file = event.target.files[0]; // 获取第一个上传的文件
            if (file) {
                textctrl_imgpath.value=file.name;
                const reader = new FileReader();
                reader.onload = function(e) {
                  const preview = document.getElementById('preview');
                  upload_src = e.target.result; // 将文件内容作为图像来源
                  preview.style.display = 'block'; // 显示图片
                };
                reader.readAsDataURL(file);
            }
        });
        textctrl_imgurl.value='https://allen2352.github.io/speed_test.jpg';
        textctrl_imgpath.value='https://allen2352.github.io/speed_test.jpg';
            upload_src='https://allen2352.github.io/speed_test.jpg';
        //---------------------------------------------------------------------
        tcontrol.addMenu(1,'file',[
            ['開新檔案',function (event){tcontrol.clear();}],
            ['開啟舊檔',function (event){tcontrol.loadfile();}],
            ['儲存檔案',function (event){tcontrol.savefile();}],
        ]);
        //----------------------------------------------------------------------------------
        tcontrol.addMenu(0,'revise',[
            ['複製',function (event){tcontrol.tmodel.copy(cm.selecting);}],
            ['剪下',function (event){tcontrol.tmodel.cut(cm.selecting);}],
        ]);
        this.setRightClick((event)=>{
            event.preventDefault();
            tcontrol.cm.show('demo_insert',event);
        });
    }
}
export var TModelRegistry={         //[類別名]對應 : [類別,主鍵] 或 [類別,null]
    'tmodel':TModel,
    'rectmodel':RectModel,
};
//========================================================================================= 以下為TModelTElement
export class TModelTElement extends TElement{         //用 TElement 包裝 [一個] 任意類型的 TModel
    constructor(tblock,bdict,tmodel_class=null){
        if(tmodel_class==null) tmodel_class=TModel;
        bdict=defaultDict(bdict,{'size':'30,30','bgcolor':'silver','border':'0'});
        super(tblock,bdict);
        //----------------------------------------------------- 基本參數
        this.size=NumberList(this.bdict['size']);
        //----------------------------------------------------- 建構內部 Tmodel
        let tmTElement=this;
        let tmodelStyle={'background-color':this.bdict['bgcolor'],'border':'0px'};
        if(this.bdict['border']=='1') tmodelStyle['border']='1px black solid';
        let tmObj=new tmodel_class(tblock.tcontrol,null,this.size,tmodelStyle);
        tmObj.addEvent('resize',(size)=>{
            tmTElement.size=size;
            tmTElement.bdict['size']=size[0]+','+size[1];
            tblock.arrange();
        });
        this.tmObj=tmObj;
        //----------------------
        if(this.bdict['tmContent']!=undefined) this.tmObj.LoadTmString(this.bdict['tmContent']);
        this.addEvent('destroy',()=>{tmObj.destroy();});
    }
    setSize(size){      //-----------------------------根據 tmObj 的 resize事件，這將會一併觸發 TElement 的setSize
        this.tmObj.setSize(size);
    }
    select(is_selected){
        super.select(is_selected);
        this.tmObj.select(is_selected);
    }
    //-----------------------------------------------------------------渲染
    render(){
        let relPos=getRelPos(this.tmodel.tcontrol,this.tmodel);
        this.tmObj.setPos([relPos[0]+this.pos[0],relPos[1]+this.pos[1]]);
        this.tmObj.arrange();
    }
    getDict(){
        this.bdict['tmContent']=this.tmObj.ToTmString();
        return this.bdict;
    }
}
export class InputRectBox extends TModelTElement{     //---------------------------方形輸入框元素
    constructor(tblock,bdict){
        bdict=defaultDict(bdict,{
            'fontFamily':'Arial','fontHeight':'30','color':'black',            // char   屬性
            'lineHeight':30,'inpcolor':'black',                                // tblock 屬性
            'size':'50,30','padding':'5,5','bgcolor':'yellow','border':'0'     // tmodel 屬性
        });
        super(tblock,bdict,RectModel);
        //------------------------------------------------------ 基本參數
        this.padding=NumberList(this.bdict['padding']);
        this.tmObj.setPadding(this.padding);
        this.nowtblock=this.tmObj.nowtblock;
        //---------------------------------------------------預設 基本輸入型態
        let irb=this;
        this.nowtblock.addInputMethod('char',(char)=>{
            return new Char(irb.nowtblock,{'char':char,
                'fontFamily':bdict['fontFamily'],'fontHeight':bdict['fontHeight'],'color':bdict['color']});
        },true);
        //------------------------------------------------------
        this.nowtblock.lineHeight=parseInt(this.bdict['lineHeight']);
        this.nowtblock.inp_color=this.bdict['inpcolor'];
    }
    //----------------------------------------------------------------外觀
    setPadding(padding){
        this.bdict['padding']=padding[0]+','+padding[1];
        this.tmObj.setPadding(padding);
    }
    //-----------------------------------------------------------------外部接口
    inputText(text){
        this.nowtblock.inputText(text);
    }
}
export class InputTextBox extends InputRectBox{           // [單行]文字輸入框
    constructor(tblock,bdict){
        bdict=defaultDict(bdict,{'padding':'5,0'});
        super(tblock,bdict);
        this.nowtblock.enableChangeLine=false;
        //-------------------------------------------------- 如果目前沒 content 可以載入，就用text初始化
        if(this.bdict['tmContent']==undefined && this.bdict['text'])
            this.inputText(this.bdict['text']);
    }
}

export class Table extends TModel{
    constructor(){
        cm.addMenu(0,'revise_table',[
            ['合併儲存格',function (event){tcontrol.tmodel.parent.combine_cells();}],
        ]);
        
        //---------------------------------------------------------------------
        cm.addMenu(1,'table',[
            ['新增&ensp;&ensp;▶','table_new'],
            ['刪除&ensp;&ensp;▶','table_delete'],
            ['清空此格',function (event){}],
            ['隱藏邊框',function (event){
                let table_obj=tcontrol.tmodel.parent;
                let border=['0px','0'];
                if(table_obj.bdict['bline']=='0')
                    border=['1px solid','1'];
                table_obj.set_border(border[0]);
                table_obj.bdict['bline']=border[1];
            }],
            ['解除合併',function (event){tcontrol.tmodel.parent.unmerge_cells()}],
        ]);
        cm.addMenu(2,'table_new',[
            ['向上新增一列',function(event){tcontrol.tmodel.parent.new_row('up');}],
            ['向下新增一列',function(event){tcontrol.tmodel.parent.new_row('down');}],
            ['向左新增一欄',function(event){tcontrol.tmodel.parent.new_col('left');}],
            ['向右新增一欄',function(event){tcontrol.tmodel.parent.new_col('right');}],
        ]);
        cm.addMenu(2,'table_delete',[
            ['刪除此列',function(event){tcontrol.tmodel.parent.del_row();}],
            ['刪除此欄',function(event){tcontrol.tmodel.parent.del_col();}],
        ]);
    }
}
TElementRegistry['inputrectbox']=[InputRectBox,null];
TElementRegistry['inputtextbox']=[InputTextBox,'text'];