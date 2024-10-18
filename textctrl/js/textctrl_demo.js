import {html_to_pdf,html_to_png} from './document.js';
import {tctrl} from './tmodel.js';
import { NavBar} from './widget.js';
import { isASCII } from './tool.js';

document.body.style="background-color:#555555;";

let nav=new NavBar();
nav.add_item('發票排版',function (event){
    
},25);
function insert_var(key,name){
    let build_dict={'color':'red',
                    'bgcolor':'yellow',
                    'key':key
    };
    tctrl.insert_message(name,build_dict);
}
function insert_var_image(key,src,w,h){
    let bdict={
        'type':'image',
        'src':src,
        'scale':w+','+h,
        'key':key
    }
    tctrl.insert_telement(bdict);
}
nav.add_dropdown('插入變數',[
    ['特店編號',function (event){insert_var(0,'特店編號')}],
    ['特店統編',function (event){insert_var(1,'特店統編')}],
    'hr',
    ['交易金額',function (event){insert_var(2,'交易金額')}],
    ['交易折抵',function (event){insert_var(3,'交易折抵')}],
    ['支付方式',function (event){insert_var(4,'支付方式')}],
    'hr',
    ['交易時間',function (event){insert_var(5,'交易時間')}],
    ['訂單編號',function (event){insert_var(6,'訂單編號')}],
    ['機台編號',function (event){insert_var(7,'機台編號')}],
    'hr',
    ['插入條碼',function (event){insert_var_image(8,'image/barcode.png',360,139)}],
    ['插入QR碼',function (event){insert_var_image(9,'image/hello world.png',200,200)}],
    'hr',
    ['自訂變數',function (event){insert_var(10,'自訂變數')}],
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
        let code=tctrl.to_eps_middle();
        navigator.clipboard.writeText(code);
        alert('已複製');
    }],
    ['png',function (event){
        update_editor(700);
        html_to_png('content','invoice.png');
        update_editor(line_width.value);
    }],
    ['pdf',function (event){
        update_editor(700);
        html_to_pdf('content','invoice.pdf');
        update_editor(line_width.value);
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
tctrl.input_mode=['eps',700/(32/2)];
tctrl.text_dict.fontSize=tctrl.input_mode[1];
//tctrl.insert_text('測');
tctrl.insert_text(test_string);
//tctrl.index=10;
//tctrl.insert_image('https://www.w3schools.com/cssref/pineapple.jpg');
//tctrl.insert_image('image/image-not-found.png');
tctrl.element_obj.id='content';
tctrl.index=15;
//tctrl.insert_table(2,3);


function update_editor(line_width){
    let all_dict=[];
    let lunit=tctrl.input_mode[1];
    tctrl.input_mode=['eps',line_width/(32/2)];
    let unit=tctrl.input_mode[1];
    tctrl.text_dict.fontSize=unit;
    for(let i=0;i<tctrl.telements.length;i++){
        let _dict=tctrl.telements[i].get_dict();
        _dict['fontSize']=unit;
        if(_dict['type']=='eps'){
            let scale=_dict['scale'].split(',');
            let w=Math.round(parseInt(scale[0])*2/unit)/2;
            let h=Math.round(parseInt(scale[1]*3/4)/unit);
            _dict['scale']=unit*w+','+unit*4/3*h;
        }
        if(_dict['type']=='image'){
            let scale=_dict['scale'].split(',');
            let w=parseInt(scale[0]);
            let h=parseInt(scale[1]);
            let rate=unit/lunit;
            _dict['scale']=w*rate+','+h*rate;
        }
        all_dict.push(_dict);
    }
    tctrl.element_obj.style.width=line_width+'px';
    tctrl.telements=[];
    tctrl.index=0;
    tctrl.displayer.innerHTML='';
    for(let i=0;i<all_dict.length;i++){
        tctrl.insert_telement(all_dict[i]);
    }
}



var line_width_block=document.createElement('div');
line_width_block.style='position: fixed;right: 130px;top: 20px;color:white';
line_width_block.innerHTML=`
<!--行byte數:&ensp;<input value="32" style="display: inline;width:20px;">&ensp;個-->
&ensp;&ensp;&ensp;縮放<input type="range" id="line-width" min="200" max="1200" value="600">
`;
document.body.appendChild(line_width_block);
var line_width=document.getElementById('line-width');
line_width.addEventListener('input',function (event){
    update_editor(document.getElementById('line-width').value);
});
