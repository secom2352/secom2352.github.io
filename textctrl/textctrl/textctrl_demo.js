import {html_to_pdf,html_to_png} from './document/document.js';
import {tctrl} from './tcontrol.js';
import { NavBar} from './widget/widget.js';

document.body.style="background-color:#555555;";

let nav=new NavBar();
//nav.add_item('發票排版',function (event){},25);
nav.add_dropdown('檔案',[
        ['開新檔案',function (event){
            tctrl.clear();
        }],
        ['開啟存檔',function (event){
            let file=document.createElement('input');
            file.type='file';
            file.addEventListener('change', function(event) {
                const file = event.target.files[0]; // 取得使用者上傳的檔案
                if (file) {
                  const reader = new FileReader();
                  reader.readAsText(file);
                  reader.onload = function(e) {
                    const fileContent = e.target.result; // 取得檔案的字串內容
                    tctrl.LoadString(fileContent);
                  };
                }
              });
            file.click();
        }],
        ['儲存檔案',function (event){
            tctrl.savefile();
        }],
    ],100);
var now_var=0;
function insert_var(key=null){
    if(key==null){
        key=now_var;
        now_var++;
    }else{
        now_var=Math.max(now_var,key+1);
    }
    let mdict={'color':'red','bgcolor':'yellow','key':key,'fontFamily':"新細明體"};
    tctrl.tmodel.insert_variable(key+'',mdict);
    //tctrl.insert_message(name,build_dict);
    //tctrl.insert_eps(key+'',{'var':key,'color':'red','bgcolor':'yellow'})
}
function insert_var_image(src,w,h,dtype){
    let bdict={
        'type':'varimage',
        'src':src,
        'scale':w+','+h,
        'key':now_var,
        'dtype':dtype
    }
    now_var++;
    tctrl.tmodel.insert_varimage(bdict);
    //tctrl.insert_text(key,{'var':key})
}
//nav.add_dropdown('插入變數',[
//    ['特店編號',function (event){insert_var(0,'特店編號')}],
//    ['特店統編',function (event){insert_var(1,'特店統編')}],
//    'hr',
//    ['交易金額',function (event){insert_var(2,'交易金額')}],
//    ['交易折抵',function (event){insert_var(3,'交易折抵')}],
//    ['支付方式',function (event){insert_var(4,'支付方式')}],
//    'hr',
//    ['交易時間',function (event){insert_var(5,'交易時間')}],
//    ['訂單編號',function (event){insert_var(6,'訂單編號')}],
//    ['機台編號',function (event){insert_var(7,'機台編號')}],
//    'hr',
//    ['插入條碼',function (event){insert_var_image(8,'image/barcode.png',360,139)}],
//    ['插入QR碼',function (event){insert_var_image(9,'image/hello_world.png',200,200)}],
//    'hr',
//    ['自訂變數',function (event){insert_var(10,'自訂變數')}],
//]);
nav.add_dropdown('系統變數',[
    //['時間',function (event){insert_var()}],
    ['條碼',function (event){insert_var_image('image/barcode.png',172,70,'barcode')}],
    ['QR code',function (event){insert_var_image('image/hello_world.png',200,200,'QR code')}],
]);
function specify_variable(){
    let variable= prompt("Enter variable");
    if (variable != null){
        insert_var(parseInt(variable));
    }
}
nav.add_dropdown('插入變數',[
    ['插入變數',function (event){insert_var()}],
    ['指定變數',function (event){specify_variable()}],
]);
function svg(class_name){
    let item={'paragraph':`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-text-paragraph" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M2 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5m0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5m4-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5"/>
                  </svg>`,
        'left':`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-text-left" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M2 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5m0-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5"></path>
                    </svg>`,
        'center':`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-text-center" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M4 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5m2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5"/>
                  </svg>`,
        'right':`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-text-right" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M6 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m-4-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5m4-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m-4-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5"/>
                  </svg>`
    }
    return item[class_name];
}
nav.add_dropdown(svg('paragraph'),[
    [svg('left'),function (event){
        tctrl.set_align('left');
    }],
    [svg('center'),function (event){
        tctrl.set_align('center');
    }],
    [svg('right'),function (event){
        tctrl.set_align('right');
    }]
],50);
//nav.add_item('匯出',undefined,undefined,true);
nav.add_dropdown('格式匯出&ensp;&ensp;',[
//    ['EPL code',function (event){
  //      tctrl.set_align('left');
    //}],
    ['中間指令',function (event){
        let code=tctrl.mtmodel.to_eps_middle();
        navigator.clipboard.writeText(code);
        alert('已複製');
    }],
    ['png',function (event){
        tctrl.zoom(1);
        html_to_png('content','invoice.png');
        tctrl.zoom(line_width.value);
    }],
    ['pdf',function (event){
        tctrl.zoom(1);
        html_to_pdf('content','invoice.pdf');
        tctrl.zoom(line_width.value);
    }]
],100,true);
//tctrl.insert_text('說明');
//let test_string='自動換行特性：之前我們曾在 HTML 基本排版 這篇提過，若是想將文字換行，必須在文字後面加上 <br> 換行標籤。但是我們本篇所介紹的 <h1> ~ <h6> 、 <p> 與 <hr> 標籤，剛好都是屬於一個文章段落的開始、結束、或段落與段落間的分隔，因此若觀察前面的範例，可以發現標題、段落、水平分隔線之間，不需要特別再加 <br> 換行標籤，即會自動以另一行 (段落) 開始。';
let test_string=`HYBRID GROUP TEST
消費明細表
--------------------------------
特店編號:
特店統編:

交易金額 NTD$ 元TX
交易金額折抵 NTD$ 元TX
實際支付金額 NTD$ 元TX
支付方式:

交易時間:
訂單編號:
機:
`;
//tctrl.insert_text('測');
tctrl.input('text',test_string);
//tctrl.index=10;
//tctrl.insert_image('https://www.w3schools.com/cssref/pineapple.jpg');
//tctrl.insert_image('image/image-not-found.png');
tctrl.element_obj.id='content';
tctrl.index=15;
//tctrl.insert_table(2,3);

var line_width_block=document.createElement('div');
line_width_block.style='position: fixed;right: 130px;top: 20px;color:white';
line_width_block.innerHTML=`
<!--行byte數:&ensp;<input value="32" style="display: inline;width:20px;">&ensp;個-->
&ensp;&ensp;&ensp;縮放<input type="range" id="line-width" min="0.1" max="1" step="0.01" value="1">
`;
document.body.appendChild(line_width_block);
var line_width=document.getElementById('line-width');
line_width.addEventListener('input',function (event){
    tctrl.zoom(document.getElementById('line-width').value)
});
//line_width.value=0.5;
