import { Panel,Frame,Button,Select, ColorButton, Label } from "./base.js";

let p1=new Panel(-1,[10,10],[300,300],{'border':'1px solid'});

let s1=new Select(p1,['123','456'],function (value){alert('你選了:'+value);},[100,150],[100,50]);

let cb=new ColorButton(p1,'顏色',function(value){cb.setStyle({'color':value});},[10,10],[50,40]);

let label=new Label(p1,'測試欄位',[100,10]);

//---------------------------------------------------
import { DragObj, Modal, MovableTube, NavBar,FooterBar } from "./widget.js";
import { ContextMenu } from "./base.js";

let p2=new Panel(-1,[400,10],[300,300],{'border':'1px solid'});

let nav=new NavBar(p2,5,{'background-color':'black'});
let b1=new Button(-1,'1號',function(event){alert('ook');});
let b2=new Button(-1,'2號',function(event){alert('oko');});
let t1=new Button(-1,'發票排版',function(event){alert('標題');},null,null,{'background-color':'green',
    'font-size':'20px'
});
nav.add_item(b1,'center');
nav.add_item(b2,'center');
nav.add_item(t1);
t1.setHover({'background-color':'yellow'});

let wbar=new FooterBar(p2,5,{'background-color':'grey'});
wbar.add_item(new Button(-1,'標籤',function(event){alert('123');},null,null),'right');

let cm=new ContextMenu();
cm.addMenu(0,'test',[
    ['按鈕1',function (event){alert('1');}],
    ['按鈕2',function (event){alert('2');}],
    ['按鈕3onqef',function (event){alert('355');}],
    ['拓展','expand']
]);
cm.addMenu(1,'expand',[
    ['拓展1',function (event){alert('11');}],
    ['拓展2',function (event){alert('12');}],
    ['拓展3',function (event){alert('13');}],
]);
cm.enable(0,'test','按鈕2',false);
cm.enable(1,'expand','拓展3',false);

p2.bindContextMenu(cm,'test');

let modal=new Modal(-1,'標題1',[500,300],function (){console.log('確認');});
let mbtn=new Button(p2,'modal',function(event){modal.launch();},[50,50]);

//-------------------------------------------------------------------------
let dbj=new DragObj(-1,[200,500],[400,30],{'background-color':'#000000','border':'1px solid'});

let p3=new Panel(-1,[200,530],[400,300],{'border':'1px solid'});
dbj.bind(p3);
//dbj.lock(false,true);

let tube=new MovableTube(p3,5,'hr',[10,10],null,{'border':'1px black solid'});
let l1=new Label(-1,'標籤');
let l2=new Button(-1,'按鈕',function(event){alert('按鈕');});
let l3=new Label(-1,'標籤3');
tube.add_item(l1);
tube.add_item(l2);
tube.add_item(l3);
let ctube=new Button(p3,'更改',function(event){
    if(tube.direct=='hr') tube.setDirect('vr');
    else tube.setDirect('hr');
},[100,100]);