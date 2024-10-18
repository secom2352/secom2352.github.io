import {tctrl} from './tmodel.js';
const { jsPDF } = window.jspdf;

function html_to_pdf(id,pdfname){
    let e=document.getElementById(id);
    let tem_border=e.style.border;
    e.style.border='0px';
    console.log('元素:'+e.offsetWidth+','+e.offsetHeight);
    html2canvas(document.querySelector("#"+id),{useCORS:true,scale: 4}).then(canvas => {
        const imgData = canvas.toDataURL("image/png");
        //const link = document.createElement('a');
        //link.href = imgData;
        //link.download = 'html_snapshot.png';
        //link.click();
        var doc = new jsPDF(1,'mm',[595,842]);
        console.log('canvas:'+canvas.width+','+canvas.height);
        doc.addImage(imgData, 'JPEG', 0, 0, 595, Math.round(595*canvas.height/canvas.width));
        doc.save(pdfname);
        e.style.border=tem_border;
    });
}

tctrl.insert_text('說明');
let test_string='自動換行特性：之前我們曾在 HTML 基本排版 這篇提過，若是想將文字換行，必須在文字後面加上 <br> 換行標籤。但是我們本篇所介紹的 <h1> ~ <h6> 、 <p> 與 <hr> 標籤，剛好都是屬於一個文章段落的開始、結束、或段落與段落間的分隔，因此若觀察前面的範例，可以發現標題、段落、水平分隔線之間，不需要特別再加 <br> 換行標籤，即會自動以另一行 (段落) 開始。';
tctrl.insert_text(test_string);
//tctrl.index=10;
//tctrl.insert_image('https://www.w3schools.com/cssref/pineapple.jpg');
//tctrl.insert_image('image/image-not-found.png');
tctrl.element_obj.id='content';
tctrl.index=15;
//tctrl.insert_table(2,3);



document.getElementById('download').addEventListener('click', function() {
    html_to_pdf("content","mypdf.pdf");
  });