//
// ペッパーブロック
//

var pepperBlock = {};

pepperBlock.blockDefCallbaks = [];

// ■ブロック定義の登録とそざいBOX追加用コールバックを登録します
pepperBlock.registBlockDef = function(callbackFunc)
{
    pepperBlock.blockDefCallbaks.push(callbackFunc);
};


//作成中メモ兼仕様メモ
// スクラッチの概念
//  丸いブロックは変数
//  丸い入力枠は数字しか入れられない入力枠。変数とは関係ないみたい。
//  四角い入力枠は文字なら何でもあり
//  四角いリストボックス枠は、2種類くらいあるみたい。変数が入るのと入らないの。
//  変数が入るのは、スプライトとか背景名(所謂シンボル)が入るものが多数みたい
//  変数が入らないのは機能が固定のものが多いみたい。
//  リストボックスで指定される名前は変数でも行けるものと、変数では設定できないものがあるみた。混合もある。どこへボックスとか
//  変数は文字列。数字変換できるなら数字っぽい。ブロックの入力は何でも受け付けるけど、扱いが
//  入力ボックスは、どうも
//    四角(自由に入力可)と丸(数値入力可)、
//    リストから選択機能と、
//    直接入力可・不可、
//    変数ドロップあり・なし
//  などの条件から作られるっぽい？ただし四角とリスト機能と自由入力を組み合わせたものはないみたい。

//■■■■■ ブロックテンプレフォーマット案 ■■■■■ 
// -- root --
// blockOpt
//   sys_version
//     'システムバージョン'
//   blockWorldId
//     'シリアライズで使う世界共通(各言語共通)の重複しない識別子' 
//      たとえば 'talkBlock' 'haiatto.talkBlock' '0x00AABBCCDDEEFF99' とか自由
//   lang
//     'jp' 'en'
//   color
//     'red' '#F88'
//   head
//     'start' 'in' ’value’
//   tail
//     'end' 'out' ’value’
//   types:
//      ["","",...]
//   supportPolling
//      true/false trueの時は、ポーリング用入力枠に入っているときにコールバックにポーリング用の引数が渡される
//
// blockContents
//   expressions
//     ***下記参照***
//   scope
//     scopeName
//   space
// {
//     blockOpt:{version:'0.01',head:'start',tail:'out'},
//     blockContents:[
//         {expressions:[]},
//         {scope:{scopeName:'scopeA',}},
//         {expressions:[]},
//         {scope:{scopeName:'scopeB',}},
//         {space:{spaceName:'spaceA',}},
//     ],
// },
// -- expressions --
// expressions
//   UIの見た目
//    - label
//      - 例 {label:"ここに"}.
//    - string    ※acceptTypes省略可
//      - 例 {string:{default:"",},dataName:'dataA', acceptTypes:["string"]},
//    - number    ※acceptTypes省略可
//      - 例 {bool:{default:false}}.
//    - bool      ※acceptTypes省略可
//    - options   ※acceptTypes必須
//      - {options:{default:'',list:[{text:'いち',value:'1'},{text:'に',value:'2'},]},dataName:'dataC', acceptTypes:["string"]},
//    - dropOnly  ※acceptTypes必須
//      - 例 {dropOnly:{default:{},label:"しゃしん１",dataName:'photo1', acceptTypes:["image"]},
//   データ
//    - dataName    データ名 ※省略不可
//    - acceptTypes 受け入れる型
//   挙動
//    - forPolling ※省略可。trueでポーリング用(イベント的な)の入力枠になります 
//
// -- 例 --
// [
//   {label:"ここに"}.
//   {string:{default:"",},dataName:'dataA', acceptTypes:["string"]},
//   {string:{default:"",},dataName:'dataB', acceptTypes:["*"]},
//   {string:{default:"",},dataName:'dataC'},
//   {options:{default:'',list:[{text:'いち',value:'1'},{text:'に',value:'2'},]},dataName:'dataC', acceptTypes:["string"]},
//   {dropOnly:{default:{},list:[{text:'いち',value:'1'},{text:'に',value:'2'},]},dataName:'dataC', acceptTypes:["string"]},
// ],
//
// -- MEMO --
// シリアライズ上の問題で今のところ dropOnly に乗ってるデータはシリアライズしない回避策をとりました
// 後でデータ周りを再考しないと…プリミティブ型以外にはメタ定義データを作るべきか悩む…初心者でも直感で理解できる構造…
//
//■■■■■ データフォーマット案 ■■■■■ 
//
// javascriptのテーブルで、
//   キーがタイプ名
//   値が  データ
// という形
// タイプは誰でも自由に追加可能。
// ROSのメッセージを意識したけど今のところバージョン管理などはしない
// 大規模な環境に耐えられる冗長性を作る気は今は無いので、
// 必要なら各フォーマット側で用意してシリアライザにチェッカー加えられるようにするとかにするかも
// でも、json化を考えると、一時的なデータは分けないと駄目かも…シリアライズ不要とか属性欲しい…(画像データとか)
//
// -- データ例 --
//  {string:"",}
//  {bool:true,}
//  {number:123,}
//  {string_list:["A","B"],}
//  {miscABC:{version:,dataA:,dataB:,},}
//
//
//■■■■■ コールバック ■■■■■ 
//
// deferredの関数。promise返す
//
// MEMO:凄くわかりやすかったdeferredの解説
//      http://techblog.yahoo.co.jp/programming/jquery-deferred/
//      ★注意★ 他の解説読む場合、JQueryのバージョン古いものの説明を読むと混乱するので注意。thenの仕様が結構何度も変わってます
//
//  function blcokCallback(execContext, valueDataTbl, scopeTbl){
//      var dfd = $.Deferred();
//      dfd.resolve(v < LIMIT);
//      return dfd.promise();
//   }
//
// execContext  グローバル環境なテーブル
// valueDataTbl 値入りテーブル
//   valueDataTbl["でーためい"]          … 受け入れる型が一つの場合の中身
//   valueDataTbl["でーためい"].タイプ名  … 受け入れる型が複数の場合の中身
//   複数受け入れの際の初期値は最初に書かれたタイプ名のものになります
// scopeTbl     スコープ用のテーブル
//   scopeTbl.scope0.scopeOut.blockObsv().deferred()


//■■■■■ 多言語対応案 ■■■■■ 
//  blockWorldId と lang で多言語対応
//  expressions の中身は言語によって順番やラベル数まで変わる可能性ありそう
//  
//==============================

//deferredの参考リンク
// http://s3pw.com/qrefy/collectdeferred/
// http://tokkono.cute.coocan.jp/blog/slow/index.php/programming/jquery-deferred-for-responsive-applications-basic/
//

var userAgent  = window.navigator.userAgent.toLowerCase();
var appVersion = window.navigator.appVersion.toLowerCase();

if (userAgent.indexOf('safari') != -1) {
    window.onerror = function (msg, file, line, column, err) {
        /*
        msg: error message
        file: file path
        line: row number
        column: column number
        err: error object
        */ 
        alert(msg + file + ':' + line);
    };
}

function _base64ToArrayBuffer(base64) {
    var binary_string =  window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array( len );
    for (var i = 0; i < len; i++)        {
        bytes[i] = binary_string.charCodeAt(i);
    }
    //return bytes.buffer;
    return bytes;
}
function _arrayBufferToBase64(buffer) {
    var binary = '';
    var bytes = new Uint8Array( buffer );
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
    }
    return window.btoa( binary );
}
function getUrlParameter(sParam)
{
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) 
    {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) 
        {
            return sParameterName[1];
        }
    }
}

//ドラッグ時にフォーカス外れない対策いるか？(現状はChrome対策)
function checkAgent_NeedDragUnselect()
{
    if (userAgent.indexOf('msie') != -1) {
        //IE全般
        if (appVersion.indexOf("msie 6.") != -1) {
            //IE6
        }else if (appVersion.indexOf("msie 7.") != -1) {
            //IE7
        }else if (appVersion.indexOf("msie 8.") != -1) {
            //IE8
        }else if (appVersion.indexOf("msie 9.") != -1) {
            //IE9
        }else if (appVersion.indexOf("msie 10.") != -1) {
            //IE10
        }
    }else if (userAgent.indexOf('chrome') != -1) {
        //Chrome
        return true;
    }else if (userAgent.indexOf('safari') != -1) {
        //Safari
    }else if (userAgent.indexOf('firefox') != -1) {
        //Firefox
    }else if (userAgent.indexOf('opera') != -1) {
        //Opera
    }
    return false;
}


// 良いものが有るかわからなかったので自作…
function Vector3(x,y,z){
    if (x instanceof Vector3){
        var v=x;
        return new Vector3(v.x,v.y,v.z);
    }
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
};
Vector3.prototype = {
    add:function(v){
        return new Vector3(this.x+v.x,this.y+v.y,this.z+v.z);
    },
    sub:function(v){            
        return new Vector3(this.x-v.x,this.y-v.y,this.z-v.z);
    },
    mul:function(v){
        if(!v instanceof Vector3) return new Vector3(this.x*v,this.y*v,this.z*v);
        return new Vector3(this.x*v.x,this.y*v.y,this.z*v.z);
    },
    div:function(v){            
        if(!v instanceof Vector3) return new Vector3(this.x/v,this.y/v,this.z/v);
        return new Vector3(this.x/v.x,this.y/v.y,this.z/v.z);
    },
    dot:function(v){            
        return (this.x*v.x + this.y*v.y + this.z*v.z);
    },
    cross:function(v){
        return new Vector3(this.y*v.z - this.z*v.y,
                           this.z*v.x - this.x*v.z,
                           this.x*v.y - this.y*v.x);
    },
    len:function(){
        return Math.sqrt(this.dot(this));
    },
    normalize:function(){
        return this.div(this.len());
    },
    rotXAxis:function(rad){            
      return new Vector3(
        this.x,
        this.y * Math.cos(rad) - this.z * Math.sin(rad),
        this.y * Math.sin(rad) + this.z * Math.cos(rad)
      );
    },
    rotYAxis:function(rad){            
      return new Vector3(
        this.x * Math.cos(rad) - this.z * Math.sin(rad),
        this.y,
        this.x * Math.sin(rad) + this.z * Math.cos(rad)
      );
    },
    rotZAxis:function(rad){            
      return new Vector3(
        this.x * Math.cos(rad) - this.y * Math.sin(rad),
        this.x * Math.sin(rad) + this.y * Math.cos(rad),
        this.z
      );
    },
};

function PepperCamera(alVideoDevice,option) {
    var self = this;
    self.subscribe = function(){
        if(!option){
            option = {};
        }
        option.name  = option.name  || "pepper_block_cam";
        option.cam   = option.cam   || 0;  // nao_top
        option.reso  = option.reso  || 1;  // 320x240
        option.color = option.color || 11; // Rgb
        option.frame_rate = option.frame_rate || 5; // frame_rate
        alVideoDevice.getSubscribers().done(function(list){
            //6個まで制限があるそうなのでゴミ掃除
            $.each(list,function(k,v){
                if(v.indexOf(option.name)==0)//とりあえず前方一致で同じと判断してみる
                {
                    alVideoDevice.unsubscribe(v);
                }
            })
        });
        alVideoDevice.subscribeCamera(
            option.name, 
            option.cam,
            option.reso,
            option.color,
            option.frame_rate
        ).done(function(nameId){
            self.nameId=nameId;
        });
    };
    self.unsubscribe = function()
    {
        alVideoDevice.unsubscribe(self.nameId);
        self.nameId = None;
    };
    self.captureImage = function(callback)
    {
        if(self.nameId.length>0)
        {
            alVideoDevice.getImageRemote(self.nameId).done(function(data){
              if(data)
              {
                  var buff = _base64ToArrayBuffer(data[6]);
                  callback(data[0],data[1], buff, data[7], data[8], data[9], data[10], data[11]);
              }
            });
        }
    };
    self.subscribe();
}


$(function(){
    if(!getUrlParameter("lunchPepper"))
    {
        $(window).on('beforeunload', function() {
            return 'このまま移動しますか？';
        });
    }
});


// データ(試行中)

function makeNullData_CaptureImage(){
    return {pixels:null, w:0, h:0, camId:0, leftRad:0, topRad:0, rightRad:0, bottomRad:0,};
}
function makeNullData_Image(){
    return {pixels:null, w:0, h:0,};
}

// ブロック

function Block(blockManager, blockTemplate, callback) {
    var self = this;

    // ■どちらかというとプライベートな部分(プライベートに出来そう)
    self.blockManager  = blockManager;
    self.blockTemplate = JSON.parse(JSON.stringify(blockTemplate));
    self.callback      = callback;

    // ■どちらかというとViewModel的な部分
    self.element = null;

    self.pix2em           = 1.0;//ピクセル単位をフォント単位に変換する値
    self.minimumRowHeightEm = 1.0;
    self.indentWidthEm      = 1.0;
    self.minimumRowHeight   = 0.0;//pix2em確定時に確定
    self.indentWidth        = 0.0;//pix2em確定時に確定
    self.blockWidth  = ko.observable(0);
    self.blockHeight = ko.observable(0);
    self.posX        = ko.observable(0);
    self.posY        = ko.observable(0);
    self.blockColor  = ko.observable(self.blockTemplate.blockOpt.color||"red");
    self.textColor   = ko.observable(self.blockTemplate.blockOpt.textColor||"white");
    self.transformStyle = ko.observable("");

    // パフォーマンスのために反映を遅延させます
    //(反映の遅延のレスポンスに影響は殆どなく寧ろ処理が軽くなって反応あがる効果あるみたいです)
//    TODO:パフォーマンス計測等のため一旦OFFあとでもどす
//    self.posX.extend({ rateLimit: 1 });
//    self.posY.extend({ rateLimit: 1 });

    //レイアウトにかかわるパラメータが更新されたら更新をかけます
    self.blockHeight.subscribe(function(){
        self.blockManager.updatePositionLayout(self,false);
    });

    // SVG要素作成のための補助
    self.makeSvgPath = function(templ,offs)
    {
        templ = templ.replace(/([0-9]+(\.[0-9]+)?)em/g, function(s,a){
            return (parseFloat(a) / self.pix2em);
        } );
        
        templ = templ.replace(/%([tlbr])(\(([+-]?[0-9]+(\.[0-9]+)?)\))?/g, function(s,a,x,b){
            var pix = 0;
            if(a=='t') pix = (-offs.top /self.pix2em);
            if(a=='l') pix = (-offs.left/self.pix2em);
            if(a=='b') pix = (-offs.top /self.pix2em + self.blockHeight());
            if(a=='r') pix = (-offs.left/self.pix2em + self.blockWidth() );
            return "" + (pix + (b?parseFloat(b):0) );
        } );
        return templ;
    };

    // ■ブロックテンプレからの準備

    // 入出力部分を準備します
    if(self.blockTemplate.blockOpt.head == 'value') {
        // 値用のブロックの連結(出力)部分
        // ※フローブロックと比べると、ある面でラムダ式っぽいかも。
        self.valueOut = {
            block:null, 
            tgtDataName:null, 
            hitArea:null,
            types: self.blockTemplate.blockOpt.types,
        };
    }
    else{
        // フロー用のブロックの連結(入出)部分
        if(self.blockTemplate.blockOpt.head == 'in') {
            self.in = {
                blockObsv:ko.observable(),
                srcScopeName:null, 
                hitArea:null
            };
        }
        if(self.blockTemplate.blockOpt.tail == 'out') {
            self.out = {
                blockObsv:ko.observable(), 
                hitArea:null
            };
        }
    }
    if(self.blockTemplate.blockOpt.supportPolling){
        self.supportPolling = true;
    }

    // 行のような部分の中身を作ります
    self.valueDataObsvTbl = {};//後で整理する(今はコールバックに渡すだけの目的で使ってるので)
    self.valueInTbl = {};
    self.scopeTbl = {};
    self.rowContents = [];
    $.each(self.blockTemplate.blockContents,function(rowIndex,contentTemplate){
        // 行のような部分を構築
        var rowContent = {
            contentTemplate:contentTemplate,
            rowBlockLocalY:ko.observable(),
            rowHeight:ko.observable(),
        };
        if(contentTemplate.expressions) {
            // 式(ラベルと値で構成される)の構築をします
            rowContent.expressions = [];
            $.each(contentTemplate.expressions,function(key,dataTemplate){
                var expression = {
                    dataTemplate:dataTemplate,
                    blockLocalX:ko.observable(0),
                    blockLocalY:ko.observable(0),
                };
                if(dataTemplate.dataName){
                    expression.acceptTypes = dataTemplate.acceptTypes;
                    expression.forPolling  = dataTemplate.forPolling;
                    expression.blockObsv   = ko.observable();
                    expression.hitArea     = null;
                    expression.valueObsv   = ko.observable();
                    self.valueInTbl[dataTemplate.dataName] = expression;
                    self.valueDataObsvTbl[dataTemplate.dataName] = expression.valueObsv;
                    if(dataTemplate.bool)
                    {
                        if(!expression.acceptTypes){
                            //受け入れ型指定が無い場合はデフォルトをセットします
                            expression.acceptTypes = ["bool"];
                        }
                        expression.valueObsv(dataTemplate.bool.default||false);
                    }
                    if(dataTemplate.string)
                    {
                        if(!expression.acceptTypes){
                            //受け入れ型指定が無い場合はデフォルトをセットします
                            expression.acceptTypes = ["string"];//HACK: 何でもありにするかも？
                        }
                        expression.valueObsv(dataTemplate.string.default||"");
                    }
                    if(dataTemplate.number)
                    {
                        if(!expression.acceptTypes){
                            //受け入れ型指定が無い場合はデフォルトをセットします
                            expression.acceptTypes = ["number"];//HACK: 何でもありにするかも？
                        }
                        expression.valueObsv(dataTemplate.number.default||0);
                    }
                    if(dataTemplate.options)
                    {
                        //ここはデフォルトの受け入れ型指定は 無し です
                        expression.valueObsv(dataTemplate.options.default||"");
                    }
                    if(dataTemplate.dropOnly)
                    {
                        //ここはデフォルトの受け入れ型指定は 無し です
                        expression.valueObsv(dataTemplate.dropOnly.default||{});
                    }
                }
                rowContent.expressions.push(expression);
            });
        }
        if(contentTemplate.scope)
        {
            // スコープがつながる先のためのデータを作ります。
            rowContent.scopeOut = {
                blockObsv:ko.observable(), 
                hitArea:null,
            };
            self.scopeTbl[contentTemplate.scope.scopeName] = rowContent;
        }
        if(contentTemplate.space)
        {
            // スペース用のデータを作ります。現状は空テーブル
            rowContent.space = {
            };
        }
        self.rowContents.push(rowContent);
    });

    // ■

    // 値用ブロックが指定のデータにつなげられる場合、型名を返します
    self.getTypeAccept = function(tgtDataName,valueBlock){
        if(valueBlock.valueOut && self.valueInTbl[tgtDataName])
        {
            if(!self.valueInTbl[tgtDataName].acceptTypes)
            {
                //受け側の無指定は受け入れ無しという扱いにします
                return null;
            }
            if(!valueBlock.valueOut.types)
            {
               // 渡す側の無指定は、受け側が何でもありの場合のみ受け入れます
               if(self.valueInTbl[tgtDataName].acceptTypes[0]=='*')
               {
                   return '*';
               }
               return null
            }
            var acceptType = null;
            $.each(self.valueInTbl[tgtDataName].acceptTypes,function(k,v){
                if(valueBlock.valueOut.types.indexOf(v)>=0)
                {
                    acceptType = v;
                }
            });
            return acceptType;
        }
    };

    // ■UI関連の処理
    
    // クローンするドラッグモード
    self.isCloneDragMode = false;
    self.setCloneDragMode = function(enable)
    {
        self.isCloneDragMode = enable;
    };

    // 接続禁止にするモード
    self.isNoConnectMode = false;
    self.setNoConnectMode = function(enable)
    {
        self.isNoConnectMode = enable;
    };

    // 要素関連のセットアップ
    self.setup = function(element){
        if(self.element){
            // 対象となる要素の再セットアップの場合…なにかやるべき？
            self.element = null;
        }
        self.element = element;
        self.pix2em  = 1.0 / ($('#pix2em').outerHeight()/10.0);
        self.minimumRowHeight = self.minimumRowHeightEm / self.pix2em;
        self.indentWidth      = self.indentWidthEm      / self.pix2em;
        if(self.in)
        {
            self.in.hitArea = $(".hitAreaIn", element);
        }
        if(self.out)
        {
            self.out.hitArea = $(".hitAreaOut", element);
        }
        if(self.valueOut)
        {
            self.valueOut.hitArea = $(".hitAreaValueOut", element);
        }
        $.each(self.valueInTbl, function(dataName,valueIn){
            valueIn.hitArea = $(".hitAreaValueIn#"+dataName, element);
        });
        $.each(self.scopeTbl, function(scopeName,scope){
            scope.scopeOut.hitArea = $(".hitAreaScopeOut#"+scopeName, element);
        });

        // ブロックに対するタッチとマウス操作をセットアップします
        self.blockManager.setupBlockTouchAndMouseAction(self);
    };

    // ■実行関連の処理
    
    // Deferred の promise作って返します
    self.deferred = function(option)
    {
        option = option || {};
        var makeFormatedValue_ = function(valueIn, valueData)
        {
            //HACK: 2015.5.29 コールバック実装的にも、煩雑になる割には、効果が薄いので、
            //HACK: この省略系は廃止して、{string:でーた}みたいな形に統一する
            //HACK: 多分そちらの方が遥かに解りやすく、ソースも読みやすく、手間も大した事なさそう
            //HACK: なにより型情報が付加されるこ事ど同義なので、前提にできれば色々実装が捗る
            //HACK: コールバック全部やコンテキスト内のデータを書き換えるのであとで一気にやる。

            // 値のデータフォーマットの加工を行います
            // ※値ブロックは主にコールバック実装者の利便性の為に、
            // 対応するタイプが１種類の場合、
            // データそのものを受け渡すルールにしてます。
            // (具体的には値ブロックが返す・入力枠が受けとるの時に値自体がわたってゆく)
            // 対応数タイプが２種類以上の場合は、
            //   valueData.タイプ名 = データ
            // といったタイプ名をキーにしたテーブルの形で受け渡します。
            // ここでは、返すブロックと受ける枠が、違うフォーマ形式、
            //   複数対応から１種対応、１種対応から複数
            // の場合の
            // データフォーマットの変換を行っています。
            // なお、未対応の組み合わせはない前提です(接続時にチェック済み)
            var formatedValue;
            if(!valueIn.blockObsv())
            {
                // 入力が即値(値ブロックでは無い)場合
                if(valueIn.acceptTypes.length>1){
                    //UI =>多
                    formatedValue = {};
                    formatedValue[valueIn.acceptTypes[0]] = valueData;

                }else{
                    //UI =>１
                    formatedValue = valueData;
                }
            }
            else if(valueIn.acceptTypes.length>1 && 
                    valueIn.blockObsv().valueOut.types.length == 1)
            {
                //１ => 多
                var inType = valueIn.blockObsv().valueOut.types[0];
                formatedValue = {};
                formatedValue[inType] = valueData;
            }
            else if(valueIn.blockObsv().valueOut.types.length > 1)
            {
                //多 => １
                var inType = valueIn.acceptTypes[0];
                formatedValue = valueData[inType];
            }
            else{
                //１ => １ or 多 => 多
                formatedValue = valueData;
            }
            return formatedValue;
        };
        var makeScopeBlockObsvDfdTbl_ = function(){
            var scopeObsvTbl = {};
            $.each(self.scopeTbl,function(k,scope){
                scopeObsvTbl[k] = scope.scopeOut.blockObsv;
            });
            return scopeObsvTbl;
        };
        
        $(self.element).removeClass("executeError"); 
        $(self.element).removeClass("executeNow");

        // 入力枠の値の評価を行います(deferredはリストにして纏めます)
        var argValueDataTbl      = {};
        var valueEvalPromiseList = [];
        $.each(self.valueInTbl,function(k,valueIn){
            if(valueIn.forPolling){
                // 入力枠がポーリング用なので評価関数を渡します(遅延評価的な雰囲気)
                if(valueIn.blockObsv()){
                    argValueDataTbl[k] = {
                        // Deferredとして実装します。ポーリングが終わるとresolveします
                        //(Deferredはエラーチェック用に必須ですが、それ以外の用途では利用しなくても別にOKです。そちらはあくまで利便性のため)
                        startPolling:function(pollingValueEndCheckCallback)
                        {
                            return valueIn.blockObsv().deferredForPolling(pollingValueEndCheckCallback);
                        },
                    };
                }else{
                    //値ブロックが無い場合はポーリング不可という事で空にします
                    argValueDataTbl[k] = {};
                }
            }
            else if(valueIn.blockObsv()){
                // 値ブロックの結果をargValueDataTblにセットします(deferredで実行)
                // HACK: この形が良いかは要検討。コールバック内に委ねる方がいいかも？
                valueEvalPromiseList.push(
                    $.Deferred(function(dfd) {
                        valueIn.blockObsv().deferred().then(function(valueData){
                            // 値入力枠に代入しておきます(値ブロックを枠から外した時に最後の評価結果が残る挙動になります)
                            self.valueDataObsvTbl[valueIn.dataTemplate.dataName](valueData);
                            // 受け渡し用のテーブルを構築します
                            argValueDataTbl[k] = makeFormatedValue_(valueIn,valueData);
                            dfd.resolve();
                        },function(){
                            dfd.reject();
                        });
                    }).promise()
                );
            }
            else{
                // 値入力枠の値を使用します
                var valueData = self.valueDataObsvTbl[valueIn.dataTemplate.dataName]();
                // 受け渡し用のテーブルにセットします
                argValueDataTbl[k] = makeFormatedValue_(valueIn,valueData);
            }
        });

        // 入力する値ブロックを評価するpromiseが全部完了したら自身のコールバックを実行します
        return $.when.apply($,valueEvalPromiseList).then(function(){
            // 自身の処理の前の処理
            $(self.element).removeClass("executeError"); 
            $(self.element).addClass("executeNow");

            // 自身の処理を実行します
            var scopeBlkObsvTbl = makeScopeBlockObsvDfdTbl_();            
            var dfdMain = self.callback(
                self.blockManager.execContext, 
                argValueDataTbl, 
                scopeBlkObsvTbl,
                option.pollingValueEndCheckCallback
            );
            if(!dfdMain){
                var dfd = $.Deferred();
                alert("コールバックがバグってます");
                dfd.reject();
                return dfd;
            }

            //MEMO: deferredの学習用メモ
            //      dfdMainは内部で非同期処理が一つもなければここで結果が出ています
            //      非同期処理があればペンティング状態で結果が出るのを待っている状態です
            //      同期処理だった場合は以降の処理の登録の瞬間にその場で実行されます
            
            // 自身の処理の後の処理を登録(実行)します
            return dfdMain.then(
                function(value){
                    // 自身の処理が成功時
                    $(self.element).removeClass("executeNow"); 
                    if(self.out && self.out.blockObsv())
                    {
                        // out部分のみここで繋ぎます(スコープ以下はコールバック内で処理するルールです)
                        return self.out.blockObsv().deferred();
                    }
                    return $.Deferred().resolve(value);
                },
                function(){
                    // 自身の処理が失敗時
                    $(self.element).removeClass("executeNow"); 
                    $(self.element).addClass("executeError");
                }
            );
        });
    };
    self.deferredForPolling = function(pollingValueEndCheckCallback)
    {
        $(self.element).removeClass("executeError"); 
        $(self.element).addClass("executeNow");

        var dfd = $.Deferred();
        if(self.supportPolling){
            //値ブロックが値更新ポーリング処理を提供している場合は
            //オプション付きでdeferredを呼びます
            dfd = self.deferred({
                pollingValueEndCheckCallback : pollingValueEndCheckCallback,
            });
        }
        else{
            //値更新ポーリング処理を提供してない場合は
            //setTimeoutで繰り返します
            var pooling = function(){
                self.deferred().then(
                  function(value){                                    
                    if(!pollingValueEndCheckCallback(value)){
                        setTimeout(pooling,0);
                    }else{
                        dfd.resolve(value);
                    }
                  },
                  function(){dfd.resolve(value);}
                );
            };
            setTimeout(pooling,0);
        }
        return dfd;
    };

    //■ 接続関連の処理

    self.clearOut = function()
    {
        if(self.out && self.out.blockObsv())
        {
            self.out.blockObsv().in.blockObsv(null);
            self.out.blockObsv(null);
        }
    };
    self.clearIn = function()
    {    
        if(self.in && self.in.blockObsv())
        {
            if(self.in.srcScopeName){
                self.in.blockObsv().clearScopeOut(self.in.srcScopeName);
            }else{
                self.in.blockObsv().clearOut();
            }
        }
    };
    self.clearScopeOut = function(scopeName){
        if(self.scopeTbl[scopeName])
        {
            if(self.scopeTbl[scopeName].scopeOut.blockObsv())
            {
                self.scopeTbl[scopeName].scopeOut.blockObsv().in.blockObsv(null);
                self.scopeTbl[scopeName].scopeOut.blockObsv().in.srcScopeName = null;
                self.scopeTbl[scopeName].scopeOut.blockObsv(null);
            }
        }
    };
    self.clearValueIn = function(dataName)
    {
        var valueIn = self.valueInTbl[dataName];
        if(valueIn && valueIn.blockObsv())
        {
            valueIn.blockObsv().valueOut.block       = null;
            valueIn.blockObsv().valueOut.tgtDataName = null;
            valueIn.blockObsv(null);
        }
    };
    self.clearValueOut = function()
    {
        if(self.valueOut && self.valueOut.block)
        {
            self.valueOut.block.clearValueIn( self.valueOut.tgtDataName );
        }
    };

    // 外側につながるブロックをセットします
    self.connectOut = function(block){
        var oldConnect = self.out.blockObsv()
        self.clearOut();
        block.clearIn();
        self.out.blockObsv(block);
        self.out.blockObsv().in.blockObsv(self);
        if(oldConnect)
        {
            var bottomBlock = self.out.blockObsv();
            while(bottomBlock.out && bottomBlock.out.blockObsv()){
                bottomBlock = bottomBlock.out.blockObsv();
            }
            if(bottomBlock.out){
                bottomBlock.connectOut(oldConnect);
            }
        }
    };

    // 値の入力のブロックをセットします
    self.connectValueIn = function(dataName, valueBlock){
        var valueIn = self.valueInTbl[dataName];
        if(valueIn)
        {
            if(self.valueOut && 
               self.valueOut.block == valueBlock)
            {
                //自身が値タイプで繋いだ先にこれから繋ぐブロックが居る場合クリアします
                self.clearValueOut();
            }

            self.clearValueIn(dataName);
            valueBlock.clearValueOut();

            valueBlock.valueOut.block       = self;
            valueBlock.valueOut.tgtDataName = dataName;
            valueIn.blockObsv(valueBlock);
        }
    };

    // 内側につながるブロックをセットします
    self.connectScopeOut = function(scopeName, block){
        if(!self.scopeTbl[scopeName])
        {
            console.log("error:" + scopeName);
            return;
        }
        var oldConnectOut = self.scopeTbl[scopeName].scopeOut.blockObsv();
        self.clearScopeOut(scopeName);

        self.scopeTbl[scopeName].scopeOut.blockObsv(block);
        block.in.blockObsv(self);
        block.in.srcScopeName = scopeName;
        
        if(oldConnectOut)
        {
            var bottomBlock = block;
            while(bottomBlock.out && bottomBlock.out.blockObsv()){
                bottomBlock = bottomBlock.out.blockObsv();
            }
            if(bottomBlock.out){
                bottomBlock.connectOut(oldConnectOut);
            }
        }
    };

    // 複製します(内側のブロックは複製されません)
    self.cloneThisBlock = function(){
        var ins = self.blockManager.createBlockIns(self.blockTemplate.blockOpt.blockWorldId);
        $.each(self.valueInTbl,function(key,valueIn){
            ins.valueInTbl[key].valueObsv(valueIn.valueObsv());
        });
        return ins;
    };
    // 複製します(内側のブロックも辿って複製します)
    self.cloneThisBlockAndConnectBlock = function(){
        var recv = function(block){
            var cloneBlock = block.cloneThisBlock();
            if(block.valueInTbl){
               $.each(block.valueInTbl,function(k,valueIn){
                   if(valueIn.blockObsv()){
                       cloneBlock.connectValueIn(
                           k, recv(valueIn.blockObsv())
                       );
                   }
               });
            }
            if(block.scopeTbl){
               $.each(block.scopeTbl,function(k,scope){
                   if(scope.scopeOut.blockObsv()){
                       cloneBlock.connectScopeOut(
                           k, recv(scope.scopeOut.blockObsv())
                       );
                   }
               });
            }
            if(block.out && block.out.blockObsv()){
                cloneBlock.connectOut(
                    recv(block.out.blockObsv())
                );
            }
            return cloneBlock;
        };
        return recv(self);
    };
}


// ■慣性などの加速を管理するもの
var AccelMove = function(callback,decSpeed){
    var self = this;
    var values      = null;
    var speedValues = null;
    var timerId     = null;
    var lastTime    = null;
    var decSpeedFunc = decSpeed||function(speed){
        var nextSpeed = speed - 0.1;
        if(Math.abs(nextSpeed)<0.1){
           nextSpeed = 0;
        }
        return nextSpeed;
    };
    self.moveInfo = {values:[],deltaValues:[]};
    self.clear = function(){
        if(timerId){
            clearInterval(timerId);
            timerId=null;
        }
        values = null;
    };
    self.isStart = function(){
        return values!=null;
    };
    self.start = function(){
        if(timerId){
            clearInterval(timerId);
            timerId=null;
        }
        values = Array.prototype.slice.call(arguments);
        speedValues = [];
        for(var ii=0; ii < values.length ; ii++){
            speedValues[ii] = 0;
        }
        var moveInfo = {values:[],deltaValues:[]};
        for(var ii=0; ii < values.length ; ii++){
            moveInfo.values     .push(values[ii]);
            moveInfo.deltaValues.push(0);
        }
        self.moveInfo = moveInfo;
        if(callback){
            callback(moveInfo);
        }
        lastTime = +new Date();
    };
    self.move = function(){
        if(!values) return;
        var nowTime = +new Date();
        var newValues = Array.prototype.slice.call(arguments);
        var deltaTime = nowTime - lastTime;
        if(deltaTime>0) {
            var moveInfo = {values:[],deltaValues:[]};
            for(var ii=0; ii < values.length ; ii++){
                var delta = newValues[ii] - values[ii];
                values[ii] = newValues[ii];
                var oldSpeed = speedValues[ii];
                var speed    = delta / deltaTime;
                // chromeでは最後に数フレ、ゼロが来たりするようなので
                // 合成してみる。加速度の変化をダンパする(変化に鈍感に)とかの方がよいのかも？
                speedValues[ii] = speed * 0.2 + oldSpeed * 0.8;
                moveInfo.values     .push(values[ii]);
                moveInfo.deltaValues.push(delta);
            }
            self.moveInfo = moveInfo;
            if(callback){
                callback(moveInfo);
            }
            lastTime = nowTime;
        }
    };
    self.end = function(){
        if(!values) return;
        var accLastTime = +new Date();
        timerId = setInterval(function(){
            var accNowTime = +new Date();
            var accDeltaTime = accNowTime - accLastTime;
            accLastTime = accNowTime;
            var endCheck = true;
            var moveInfo = {values:[],deltaValues:[]};
            for(var ii=0; ii < values.length ; ii++)
            {
                //減速
                speedValues[ii] = decSpeedFunc(speedValues[ii],accDeltaTime);
                if(!speedValues[ii]) speedValues[ii] = 0;
                if(Math.abs(speedValues[ii]) > 0){
                    endCheck = false;
                }
                var diff  = speedValues[ii] * accDeltaTime;
                values[ii] = values[ii] + diff;
                moveInfo.values     .push(values[ii]);
                moveInfo.deltaValues.push(diff);
            }
            if(callback){
                callback(moveInfo);
            }
            if(endCheck){
                self.clear();
            }
        },15);
    };
};

// ■タッチ移動簡易管理
var TouchMove = function(opt){
    var self = this;
    self.opt = opt||{
        //スクリーン座標を使うか？
        // 廃止！iosとchromeとか扱いが機種依存しまくる値だったorz
        ////useScreen:false,
        //自身が動く場合用オプション。移動値を積算してオフセットとして引いた値にします
        useSelfMove:false,
    };
    self.touchInfo={}
    self.touchInfoFing=[];
    self.start = function(e){
        $.each(e.originalEvent.changedTouches,function(k,touch){
            var fingId = 0;
            if(self.touchInfo[touch.identifier]){
                fingId = self.touchInfo[touch.identifier].fingId;
            }
            else{
                for(;self.touchInfoFing[fingId];fingId++){}
            }
            self.touchInfoFing[fingId] = 
            self.touchInfo[touch.identifier] = {
                sx: touch.pageX,
                sy: touch.pageY,
                lx: touch.pageX,
                ly: touch.pageY,
                dx:0,dy:0,
                fingId:fingId,
                touchId:touch.identifier,
                isFirst:true,
                sumDX:0,
                sumDY:0,
            };
        });
    };
    self.move = function(e){
        $.each(self.touchInfo,function(k,info){
            if(info){
                info.dx=0;
                info.dy=0;
                info.isFirst = false;
            }
        });
        $.each(e.originalEvent.changedTouches,function(k,touch){
            var info = self.touchInfo[touch.identifier];
            if(!info)return;
            var x = touch.pageX;
            var y = touch.pageY;
            if(self.opt.useSelfMove){
                x = x + info.sumDX;
                y = y + info.sumDY;
            }
            info.dx = x - info.lx;
            info.dy = y - info.ly;
            info.lx = x;
            info.ly = y;
            info.sumDX = info.sumDX + info.dx;
            info.sumDY = info.sumDY + info.dy;
        });
    };
    self.end = function(e){
        $.each(e.originalEvent.changedTouches,function(k,touch){
            var info = self.touchInfo[touch.identifier];
            if(info){
                self.touchInfoFing[info.fingId]  = null; 
                self.touchInfo[touch.identifier] = null;
            }
        });
    };
};


// ■ブロック作業場
var BlockWorkSpace = function (blockManager, dragScopeName, workspaceName){
    var self = this;

    self.blockManager      = blockManager;
    self.workspaceNameObsv = ko.observable(workspaceName||"あたらしいエリア");
    self.blockListObsv     = ko.observableArray();
    self.workAreaElement   = null;
    self.dragScopeName     = dragScopeName;
    self.id                = blockManager.blockWsIdSeed_++;

    self.offsetX = ko.observable(0);
    self.offsetY = ko.observable(0);
    self.scale   = ko.observable(1.0);
    self.transformStyle = ko.observable("");
    self.scrollLock = false;

    var updateWsOffsetTimer_=null;
    var updateWorkSpaceOffset_ = function(){
        if(self.workAreaElement)
        {
            if(updateWsOffsetTimer_)
            {
                clearInterval(updateWsOffsetTimer_);
                updateWsOffsetTimer_ = null;
            }
            var ox = self.offsetX();
            var oy = self.offsetY();
            var s  = self.scale();

            //★速度アップにかなり効果あり！★
            self.transformStyle(
                //" translate3d("+ox+"px,"+oy+"px,0)"+
                " scale("+s+","+s+")"
            );
            // 軽い処理で移動させる(Chromeとsafariで効果を確認)
            var rootElm = $(".box-workspace-transform-root",self.workAreaElement);
            rootElm.css({
                "-webkit-transform":
                  " translate3d("+ox+"px,"+oy+"px,0)",
            });
            updateWsOffsetTimer_ = setInterval(function(){
                //ぼやけた画像をくっきりさせる(Chromeとsafariで効果を確認)
                rootElm.css({
                    "-webkit-transform":
                      " translate("+ox+"px,"+oy+"px)",
                });
            },300);
        }
    }

    self.offsetX.subscribe(updateWorkSpaceOffset_);
    self.offsetY.subscribe(updateWorkSpaceOffset_);


    // シリアライズ関連です
    self.toJSON = function()
    {
        var topBlockList = [];
        $.each(self.blockListObsv(),function(k,blockObsv){
            var topBlock = self.blockManager.getLumpTopBlock(blockObsv());
            if(topBlockList.indexOf(topBlock)<0){
                topBlockList.push( topBlock );
            }
        });
        var blocks = [];
        $.each(topBlockList,function(k,topBlock){
            blocks.push(self.blockManager.toJSON_LumpBlocks(topBlock));
        });
        return {
            name:self.workspaceNameObsv(),
            blocks:blocks,
        };
    };
    self.fromJSON = function(json)
    {
        self.clearAllBlocks();
        self.workspaceNameObsv(json.name);
        $.each(json.blocks,function(k,topBlockJson){
            var block = self.blockManager.fromJSON(topBlockJson);
            self.addBlock( block );
            block.posX(block.posX()/block.pix2em);
            block.posY(block.posY()/block.pix2em);
            self.blockManager.updatePositionLayout(block,false);
        });
    };

    // UI関連です

    self.tabSelect = function(data,e){
        console.log("ttt");
    };

    // 作業場のリスト操作関連です
    self.addBlock = function(newBlock)
    {
        blockManager.traverseUnderBlock(newBlock,{
            blockCb:function(block){
                self.blockListObsv.push(ko.observable(block));
                block.setCloneDragMode(false);
                block.setNoConnectMode(false);
            },
        });
        // zIndexを振りなおします
        var zIndex = 100;
        $.each(self.blockListObsv,function(k,blockObsv){
            $(blockObsv.element).css({zIndex:zIndex});
            zIndex+=1;
        });
    };
    self.addBlock_CloneDragMode = function(newBlock)
    {
        blockManager.traverseUnderBlock(newBlock,{
            blockCb:function(block){
                self.blockListObsv.push(ko.observable(block));
                block.setCloneDragMode(true);
                block.setNoConnectMode(true);
            },
        });
    };
    self.removeBlock = function(removeBlock)
    {
        removeBlock.clearIn();
        blockManager.traverseUnderBlock(removeBlock,{
            blockCb:function(block){
                self.blockListObsv.remove(function(blockObsv){
                    return block==blockObsv();
                });
            },
        });
    };
    self.clearAllBlocks = function()
    {
        self.blockListObsv.removeAll();
    };
    self.isContainsBlock = function(block){
        var bFind=false;
        $.each(self.blockListObsv(),function(key,blockInsObsv){
            if(blockInsObsv()==block){
                bFind = true;
                return false;
            }
        });
        return bFind;
    };

    // ブロックを並べるレイアウトを行います
    self.autoLayoutDirty = false;
    self.autoLayoutCb = null;
    self.setAutoArrayLayout = function(){
        self.autoLayoutDirty = true;
        self.autoLayoutCb = function(){
            var posSX = 10;
            var posSY = 20;
            var posX  = posSX;
            var posY  = posSY;
            var wrapWem   = 30;
            var nowMaxH = 0;
            $.each(self.blockListObsv(),function(key,blockInsObsv){
                blockIns = blockInsObsv();
                blockIns.posX(posX);
                blockIns.posY(posY);
                posX += blockIns.blockWidth()  + 3.0 / blockIns.pix2em;
                nowMaxH = Math.max(nowMaxH, blockIns.blockHeight());
                if(posX-posSX > wrapWem/blockIns.pix2em)
                {
                    posX  = posSX;
                    posY += nowMaxH + + 2.0 / blockIns.pix2em;
                    nowMaxH = 0;
                }
                self.blockManager.updatePositionLayout( blockIns, false );
            });
        };
    };

    self.setup = function(workAreaElement){
        self.workAreaElement = workAreaElement;
        //■ゴミ箱■        
        var topElm = $(self.workAreaElement).parent();
        var trashBox = $(".box-trash-box",topElm);
        var trashBoxUpdate = function(){
            if($(self.workAreaElement).css("display")!="none"){
                $(trashBox).css({
                   left:0,
                   top:$(self.workAreaElement).height()-$(trashBox).outerHeight(), 
                });
            }
        };
        $(window).resize(function(e){
            trashBoxUpdate();
        });
        trashBoxUpdate();
    };

    // コリジョン判定
    var checkHitRectDist = function(block0, block1, rect0, rect1){
        var offs0 = {left:block0.posX()+rect0.x, top:block0.posY()+rect0.y};
        var offs1 = {left:block1.posX()+rect1.x, top:block1.posY()+rect1.y};
        var w0    = rect0.w;
        var h0    = rect0.h;
        var w1    = rect1.w;
        var h1    = rect1.h;
        if(offs0.top < offs1.top + h1&&
           offs1.top < offs0.top + h0&&
           offs0.left < offs1.left + w1&&
           offs1.left < offs0.left + w0)
        {
            var vx = (offs0.left + w0/2) - (offs1.left + w1/2);
            var vy = (offs0.top  + h0/2) - (offs1.top  + h1/2);
            return Math.sqrt(vx*vx + vy*vy);
        }
    };

    //■ 作業場内のブロックとのヒット判定を行います(渡すブロックは作業場外のものでもOKです)
    self.getHitBlock = function(block){
        var nearDist = 99999999;
        var hitBlock = null;
        var srcBlock = null;
        var isIn     = false;
        var valueName= null;
        // 入出力ブロックを取り出します
        var inBlock  = null;
        var outBlock = null;
        var valueBlock = null;
        if(block.in){
            inBlock = block;
        }
        if(block.out){
            outBlock = block;
            while(outBlock.out){
                if(outBlock.out.blockObsv()){
                    outBlock = outBlock.out.blockObsv();
                }
                else{
                    break; 
                }
            }
        }
        if(block.valueOut){
            valueBlock = block;
        }
        // ヒットチェックをします
        // TODO:所属リストのチェックをするべき
        $.each(self.blockListObsv(),function(k,tgtBlockObsv){
            var tgtBlock = tgtBlockObsv();
            if(tgtBlock.isNoConnectMode){
                return;
            }
            var dist;
            if(tgtBlock == inBlock) return;
            if(tgtBlock == outBlock) return;
            if(tgtBlock == valueBlock) return;
            if(tgtBlock.in && !tgtBlock.in.blockObsv() && 
               outBlock && outBlock.out){
                // 出力と入力のヒットは入力が未接続の場合のみやります(その方が直感的そうなので)
                dist = checkHitRectDist(tgtBlock,outBlock,tgtBlock.in.hitAreaRect,outBlock.out.hitAreaRect);
                if(dist && dist < nearDist){
                    nearDist = dist;
                    hitBlock = tgtBlock;
                    srcBlock = outBlock;
                    isSrcIn  = false;
                    valueName = null;
                    scopeName = null;
                }
            }
            if(tgtBlock.out && inBlock){
                //dist = checkHitDist($(tgtBlock.out.hitArea), $(inBlock.in.hitArea));
                dist = checkHitRectDist(tgtBlock,
                                        inBlock,
                                        tgtBlock.out.hitAreaRect,
                                        inBlock.in.hitAreaRect);
                if(dist && dist < nearDist){
                    nearDist = dist;
                    hitBlock = tgtBlock;
                    srcBlock = inBlock;
                    isSrcIn  = true;
                    valueName = null;
                    scopeName = null;
                }
            }
            if(inBlock){
                $.each(tgtBlock.scopeTbl,function(name,scope){
                    //dist = checkHitDist($(scope.scopeOut.hitArea), $(inBlock.in.hitArea));
                    dist = checkHitRectDist(tgtBlock, inBlock, scope.scopeOut.hitAreaRect, inBlock.in.hitAreaRect);
                    if(dist && dist < nearDist){
                        nearDist = dist;
                        hitBlock = tgtBlock;
                        srcBlock = inBlock;
                        isSrcIn  = true;
                        valueName = null;
                        scopeName = name;
                    }
                });
            }
            if(valueBlock){
                $.each(tgtBlock.valueInTbl,function(name,valueIn){
                    //dist = checkHitDist($(valueIn.hitArea), $(valueBlock.valueOut.hitArea));
                    dist = checkHitRectDist(tgtBlock, valueBlock, valueIn.hitAreaRect, valueBlock.valueOut.hitAreaRect);
                    if(dist && dist < nearDist){
                        if(tgtBlock.valueInTbl[name].blockObsv())
                        {
                            //値ブロックの場合接続済みな場合は無視します
                            //(上に乗っかったものでUIが塞がっているので)
                            return;
                        }
                        if(self.blockManager.checkContainLumpBlock(valueBlock, tgtBlock))
                        {
                            //自身が接続しているブロックの塊内は無視します
                            return;
                        }
                        if(tgtBlock.getTypeAccept(name,valueBlock))
                        {
                            nearDist = dist;
                            hitBlock = tgtBlock;
                            srcBlock = valueBlock;
                            isSrcIn  = false;
                            valueName = name;
                            scopeName = null;
                        }
                    }
                });
            }
        });
        if(hitBlock){
            return {hitBlock:hitBlock,
                    srcBlock:srcBlock,
                    isSrcIn:isSrcIn,
                    valueName:valueName,
                    scopeName:scopeName,};
        }
    };
};

// ブロック作業場用のカスタムバインド
ko.bindingHandlers.blockWorkSpaceSetup = {
    init: function(element, valueAccessor) {
        // ブロックの要素生成時の初期化を行います
        var blockWsIns = ko.unwrap(valueAccessor());
        blockWsIns.setup( element );

        // ユーザーデータにIDを付加します
        $(element).data("blockWorkSpaceId",blockWsIns.id);
        // ブロック作業場を要素から引くためにテーブルに追加します
        blockWsIns.blockManager.elementBlockWsLookupTbl[$(element).data("blockWorkSpaceId")] = blockWsIns;

        // 要素が操作可能な背景である事を識別するためにクラスを付加します
        $(element).addClass("controlableBlockWsBG");

        // ワークスペースのUI操作を構築します
        var isMouseEvent = function(e){
            if(e.originalEvent.touches)return false;
            return true;
        };
        var isFirstTouch = function(e){
            //最初の指でタッチしたかを判定します
            if(e.originalEvent.touches){
                var touch = e.originalEvent.touches[0];
                if(touch && !$(touch.target).hasClass("controlableBlockWsBG")){
                    return false;
                }
            }
            return true;
        };
        var isTouchEvent = function(e){
        }
        var getOnePosition = function(e){
            if(e.originalEvent.touches){
                var touch = e.originalEvent.touches[0];
                if(!touch){
                    touch = e.originalEvent.changedTouches[0];
                }
                return {x:touch.pageX,
                        y:touch.pageY};
            }
            else{
                return {x:e.pageX,
                        y:e.pageY};
            }
        };
        var mouseDownFlg = false;
        var lastPos  = null;
        var touchMove = new TouchMove();            
        var TouchST = function(){
            var self = this;
            var touchInfo={};
            var touchInfoFing=[];
            self.st = null;
            self.start = function(e){
                $.each(e.originalEvent.changedTouches,function(k,touch){
                    var fingId = 0;
                    if(touchInfo[touch.identifier]){
                        fingId = touchInfo[touch.identifier].fingId;
                    }
                    else{
                        for(;touchInfoFing[fingId];fingId++){}
                    }
                    touchInfoFing[fingId] = 
                    touchInfo[touch.identifier] = {
                        sx:touch.pageX,
                        sy:touch.pageY,
                        lx:touch.pageX,
                        ly:touch.pageY,
                        dx:0,dy:0,
                        fingId:fingId,
                    };
                });
            };
            self.move = function(e){
                $.each(touchInfo,function(k,info){
                    if(info){
                        info.dx=0;
                        info.dy=0;
                    }
                });
                var calcDist = function(dx,dy){return Math.sqrt(dx*dx+dy*dy);}
                var t0 = touchInfoFing[0];
                var t1 = touchInfoFing[1];
                if(t0&&t1){
                    if(!self.st){
                        self.st = {
                            centerDelta:{X:0,y:0},
                            scaleDelta:0.0,
                            center:{x:(t0.lx-t1.lx)/2+t1.lx,
                                    y:(t0.ly-t1.ly)/2+t1.ly},
                            scale:1.0,
                            fingDist:calcDist(t0.lx-t1.lx,t0.lx-t1.lx),
                        };
                    }
                }
                else{
                    self.st = null;
                }
                $.each(e.originalEvent.changedTouches,function(k,touch){
                    var info = touchInfo[touch.identifier];
                    if(info){
                        info.dx = touch.pageX - info.lx;
                        info.dy = touch.pageY - info.ly;
                        info.lx = touch.pageX;
                        info.ly = touch.pageY;
                    }
                });
                if(t0&&t1){
                    var newCenter = {x:(t0.lx-t1.lx)/2+t1.lx,
                                     y:(t0.ly-t1.ly)/2+t1.ly};
                    var nowFingDist = calcDist(t0.lx-t1.lx,t0.lx-t1.lx);
                    var newScale = nowFingDist / self.st.fingDist;
                    self.st.centerDelta.x = newCenter.x - self.st.center.x;
                    self.st.centerDelta.y = newCenter.y - self.st.center.y;
                    self.st.center = newCenter;
                    self.st.scaleDelta = nowFingDist / (self.st.fingDist * self.st.scale);
                    self.st.scale = newScale;
                }
            };
            self.end = function(e){
                $.each(e.originalEvent.changedTouches,function(k,touch){
                    var info = touchInfo[touch.identifier];
                    if(info){
                        touchInfoFing[info.fingId]  = null; 
                        touchInfo[touch.identifier] = null;
                    }
                });
                var t0 = touchInfoFing[0];
                var t1 = touchInfoFing[1];
                if(!t0&&!t1){
                    self.st = null;
                }
            };
        };
        var touchSt = new TouchST();
        var TouchDblTap = function(callback){
            var self = this;
            var touchInfos={};
            var GAP = 15;
            var DOUBLE_TAP_TIME = 400;
            var startTapTime= null;
            var lastTapTime = null;
            var clear_ = function(){
                startTapTime= null;
                lastTapTime = null;
                touchInfos = {};
            };
            self.dblTap = null;
            self.start = function(e){
                $.each(e.originalEvent.changedTouches,function(k,touch){
                    touchInfos[touch.identifier] = {
                        sx:touch.pageX,
                        sy:touch.pageY,
                    };
                    if(!lastTapTime){
                        startTapTime = +new Date();
                    }
                });
            };
            self.move = function(e){
                $.each(e.originalEvent.changedTouches,function(k,touch){
                    if(touchInfos[touch.identifier]){  
                        var dx = touch.pageX - touchInfos[touch.identifier].sx;
                        var dy = touch.pageY - touchInfos[touch.identifier].sy;
                        if(Math.abs(dx)>GAP||Math.abs(dy)>GAP){
                            clear_();
                        }
                    }
                });
            };
            self.end = function(e){                
                $.each(e.originalEvent.changedTouches,function(k,touch){
                    if(touchInfos[touch.identifier]){
                        touchInfos[touch.identifier] = null;
                    }
                    var nowTime = +new Date();
                    if( (nowTime - startTapTime) < DOUBLE_TAP_TIME){
                        if( lastTapTime ){
                            if(self.dblTap){
                                self.dblTap();
                            }
                            clear_();
                        }
                        else{
                            lastTapTime = nowTime;
                        }
                    }
                    else{
                        clear_();
                    }
                });
            };
        };
        var touchDblTap = new TouchDblTap();
        touchDblTap.dblTap = function(){
            var minBX = 99999;
            var minBY = 99999;
            var maxBX = -99999;
            var maxBY = -99999;
            $.each(blockWsIns.blockListObsv(),function(k,blockObsv){
                var block = blockObsv();
                minBX = Math.min(minBX,block.posX());
                minBY = Math.min(minBY,block.posY());
                maxBX = Math.max(maxBX,block.posX()+block.blockWidth());
                maxBY = Math.max(maxBY,block.posY()+block.blockHeight());
            });
            if(minBX<maxBX){
                var w = maxBX - minBX;
                var h = maxBY - minBY;
                var cx = w/2 - minBX;
                var cy = h/2 - minBY;

                var scale = blockWsIns.scale();
                var areaW = $(blockWsIns.workAreaElement).width() * scale;
                var areaH = $(blockWsIns.workAreaElement).height()* scale;
                
                var scaleW = areaW / w;
                var scaleH = areaH / h;
                var scale = Math.min(scaleW,scaleH);
                scale = Math.min(scale,3.0);
                blockWsIns.scale(scale * 0.9);
                areaW = $(blockWsIns.workAreaElement).width() ;
                areaH = $(blockWsIns.workAreaElement).height();

                blockWsIns.offsetX(-minBX + (areaW-w)/2);
                blockWsIns.offsetY(-minBY + (areaH-h)/2);
            }
        };
        var accelMove = new AccelMove(
            function(moveInfo){
                var dx = moveInfo.deltaValues[0]*1.0/blockWsIns.scale();
                var dy = moveInfo.deltaValues[1]*1.0/blockWsIns.scale();
                blockWsIns.offsetX(dx + blockWsIns.offsetX());
                blockWsIns.offsetY(dy + blockWsIns.offsetY());
            },
            function(speed,deltaTime){
                if(speed!=0)
                {
                    var decSpeed  = 8*blockWsIns.scale() / 1000 * deltaTime;
                    var nextSpeed = speed - ((speed>0)?decSpeed:-decSpeed);
                    if((nextSpeed>0) != (speed > 0)||
                        Math.abs(nextSpeed)<0.01)
                    {
                       nextSpeed = 0;
                    }
                    //console.log("s:"+speed+" n:"+nextSpeed+" d:"+decSpeed);
                }
                return nextSpeed;
            }
        );

        var nowControl=false;
        var checkTarget =function(elem){
            if($(elem).hasClass("noDrag")){
                return false;
            }
            if(["INPUT","TEXTAREA",
                "BUTTON","SELECT",
                "OPTION"].indexOf($(elem).prop("tagName"))>=0)
            {
                return false;
            }
            return true;
        };

        $(element).on({
            'touchstart mousedown': function (e) {
                if(!checkTarget(e.target)){
                    return;
                }
                e.preventDefault();
                if ( $(e.target).hasClass("controlableBlockWsBG") )
                {
                    if(!isFirstTouch(e)){//タッチの場合は最初の指の対象がここ以外なら無視します
                        return;
                    }
                    if(e.originalEvent.changedTouches){
                        touchMove.start(e);
                        touchSt.start(e);
                        touchDblTap.start(e);
                    }
                    if(!nowControl)
                    {
                        nowControl = true;
                        blockWsIns.blockManager.editMode.lazyEditModeCancel();

                        var target = $(this);
                        if(isMouseEvent(e)){
                            mouseDownFlg = true;
                        }
                        lastPos = null;
                        if(isMouseEvent(e)){
                            lastPos = {x:e.pageX,y:e.pageY};       
                        }
                        else if(touchMove.touchInfoFing[0]){
                            lastPos = {
                                x:touchMove.touchInfoFing[0].lx,
                                y:touchMove.touchInfoFing[0].ly
                            };
                        }
                        accelMove.start(lastPos.x, lastPos.y);
                    }
                }
            },
            'touchmove mousemove': function (e) {
                if(!checkTarget(e.target)){
                    return;
                }
                event.preventDefault();
                if(!nowControl){
                    return;
                }
                if(e.originalEvent.changedTouches){
                    touchMove.move(e);
                    touchSt.move(e);
                    touchDblTap.move(e);
                }
                var target = $(this);
                if(isMouseEvent(e) && !mouseDownFlg){
                    return;
                }
                var nowPos = null;
                if(isMouseEvent(e)){
                    nowPos = {x:e.pageX,y:e.pageY};       
                }
                else if(touchMove.touchInfoFing[0]){
                    nowPos = {
                        x:touchMove.touchInfoFing[0].lx,
                        y:touchMove.touchInfoFing[0].ly
                    };
                }
                if(touchSt.st){
                    var scaleDelta = touchSt.st.scaleDelta;
                    var nowScale   = blockWsIns.scale();
                    var newScale   = scaleDelta * nowScale;
                    if(newScale<=0.2){
                        scaleDelta = 0.2/nowScale;
                        newScale = 0.2;
                    }
                    else if(newScale>=5.00){
                        scaleDelta = 5.0/nowScale;
                        newScale = 5.0;
                    }
                    var elmOfs = $(blockWsIns.workAreaElement).offset();
                    var cx = (touchSt.st.center.x - elmOfs.left)/(nowScale*scaleDelta);
                    var cy = (touchSt.st.center.y - elmOfs.top )/(nowScale*scaleDelta);

                    var wsOfx = (blockWsIns.offsetX()-cx) * scaleDelta + cx;
                    var wsOfy = (blockWsIns.offsetY()-cy) * scaleDelta + cy;
                    blockWsIns.offsetX(wsOfx/scaleDelta);
                    blockWsIns.offsetY(wsOfy/scaleDelta);
                    blockWsIns.scale(newScale);
                }
                else{
                    var nowTime = +new Date();
                    if(lastPos&&nowPos){
                        if(!blockWsIns.scrollLock){
                            accelMove.move(nowPos.x,nowPos.y);
                        }
                        else{
                            accelMove.move(0,0);
                        }
                    }
                    lastPos = nowPos;
                }
            },
            'mouseout': function (e) {
                nowControl = false;
                mouseDownFlg = false;
            },
            'touchend mouseup': function (e) {
                if(!checkTarget(e.target)){
                    return;
                }
                event.preventDefault();
                if(e.originalEvent.changedTouches){
                    touchMove.end(e);
                    touchSt.end(e);
                    touchDblTap.end(e);
                }
                if(!nowControl){
                    return;
                }
                if(!touchMove.touchInfo[0] && !touchSt.st){
                    nowControl = false;
                    mouseDownFlg = false;
                }
                if(!nowControl && !blockWsIns.scrollLock){
                    accelMove.end();
                }
            },
        });
    },
    update: function(element, valueAccessor) {
    }
};
//ブロックのレイアウトの自動更新処理用バインドです(foreach:ブロックリストの後呼ばれるようにしています)
ko.bindingHandlers.blockWorkSpaceAutoLayout = {
    init:function(element,valueAccessor)
    {
        var blockWs = ko.unwrap(valueAccessor());
        if(blockWs.autoLayoutCb){
            blockWs.autoLayoutCb();
        }
    },
    update: function(element, valueAccessor) {
        var blockWs = ko.unwrap(valueAccessor());
        if(blockWs.autoLayoutDirty){
            if(blockWs.autoLayoutCb){
                blockWs.autoLayoutCb();
            }
            blockWs.autoLayoutDirty = false;
        }
    }
};

// ブロック作業場向けのタブUI用カスタムバインド
ko.bindingHandlers.boxCreate = {
    init: function(boxElement, valueAccessor, allBindings, viewModel, bindingContext) {
        var blockWsLst = valueAccessor();

        // Make a modified binding context, with a extra properties, and apply it to descendant elements
        var childBindingContext = bindingContext.createChildContext(
            blockWsLst,
            null, // Optionally, pass a string here as an alias for the data item in descendant contexts
            function(context) {
                ko.utils.extend(context, valueAccessor());
            });
        ko.applyBindingsToDescendants(childBindingContext, boxElement);

        // Also tell KO *not* to bind the descendants itself, otherwise they will be bound twice
        return { controlsDescendantBindings: true };
    },
    update: function(element, valueAccessor) {
        var blockWsLst = ko.unwrap(valueAccessor());
    }
};
ko.bindingHandlers.boxTabs = {
    init: function(tabsElement, valueAccessor, allBindings, viewModel, bindingContext) {
        var blockWsLst = ko.unwrap(valueAccessor());
        var boxElem    = $(tabsElement).parents(".blockBox");
        var tabsElem   = $(tabsElement);
        var panelElm   = $(".box-tabs-panel",boxElem);

        //タブの初期状態をセット
        $(".box-workspace",boxElem).addClass("box-workspace-hide");

        var tabLayoutUpdate = function(){
            tabsElem.css({
               left:boxElem[0].clientWidth - tabsElem.outerWidth() + boxElem.scrollLeft() +"px",
               top: boxElem.scrollTop() +"px",
               overflow:"hidden"
           });
        };


        // パネル部分
        boxElem.scroll(function(e){
            tabLayoutUpdate();
        });
        $(window).resize(function(e){
            tabLayoutUpdate();
        });
        tabLayoutUpdate();

        var lastPosX=0;
        var lastPosY=0;
        var accVX=0;
        var accVY=0;
        var tabMenuY=0;
        var mouseDownFlg = false;
        var accIntervalId = null;
        var startTouchEvent = null;
        var startTouchTime  = null;
        var accelMove = new AccelMove(
            function(moveInfo){
                //$("body").scrollTop($("body").scrollTop()-moveInfo.deltaValues[0]);
                tabMenuY += moveInfo.deltaValues[0];
                if(tabMenuY < -panelElm.outerHeight()){
                    tabMenuY = boxElem.height();
                }
                else if(tabMenuY > boxElem.height()){
                    tabMenuY = -panelElm.height();
                }
                $(".box-tabs-panel",boxElem).css({
                    top:tabMenuY,
                });
            },
            function(speed,deltaTime){
                if(speed!=0)
                {
                    var decSpeed  = 2 / 1000 * deltaTime;
                    var nextSpeed = speed - ((speed>0)?decSpeed:-decSpeed);
                    if((nextSpeed>0) != (speed > 0)||
                        Math.abs(nextSpeed)<0.01)
                    {
                       nextSpeed = 0;
                    }
                    //console.log("s:"+speed+" n:"+nextSpeed+" d:"+decSpeed);
                }
                return nextSpeed;
            }
        );
        tabsElem.on({
            'touchstart mousedown': function (event) {
                event.preventDefault();
                var target = $(this);
                if(event.originalEvent.touches){
                    var touch = event.originalEvent.touches[0];
                    lastPosX = touch.pageX;
                    lastPosY = touch.pageY;
                    startTouch = {pageX:touch.pageX,
                                  pageY:touch.pageY};
                    startTouchTime = event.originalEvent.timeStamp;
                }
                else{
                    lastPosX = event.pageX;
                    lastPosY = event.pageY;
                    mouseDownFlg = true;
                }
                accelMove.start(lastPosY);
                if(accIntervalId){
                    clearInterval(accIntervalId);
                    accIntervalId = null;
                }
                return false;
            },
            'touchmove mousemove': function (event) {
                event.preventDefault();
                var target = $(this);
                var moveX = 0;
                var moveY = 0;
                if(event.originalEvent.touches){
                    var touch = event.originalEvent.touches[0];
                    moveX = touch.pageX - lastPosX;
                    moveY = touch.pageY - lastPosY;
                    lastPosX = touch.pageX;
                    lastPosY = touch.pageY;
                }
                else{
                    if(mouseDownFlg){
                        moveX = event.pageX - lastPosX;
                        moveY = event.pageY - lastPosY;
                        lastPosX = event.pageX;
                        lastPosY = event.pageY;
                    }
                }
                accelMove.move(lastPosY);
                /*
                accVX = moveX*0.3 + accVX*0.7;            
                accVY = moveY*0.3 + accVY*0.7;
                if(moveY!=0){
                    tabMenuY += moveY;
                    if(tabMenuY < -panelElm.outerHeight()){
                        tabMenuY = boxElem.height();
                    }
                    else if(tabMenuY > boxElem.height()){
                        tabMenuY = -panelElm.height();
                    }
                    $(".box-tabs-panel",boxElem).css({
                        top:tabMenuY,
                    });
                }
                */
                return false;
            },
            'mouseout': function (event) {
                mouseDownFlg = false;
            },
            'touchend mouseup': function (event) {
                event.preventDefault();
                var target = $(this);
                if(event.originalEvent.touches){
                    var touch = event.originalEvent.touches[0];
                    if(!touch){
                        touch = event.originalEvent.changedTouches[0];
                    }
                    if(touch){
                        lastPosX = touch.pageX;
                        lastPosY = touch.pageY;
                        if(startTouch)
                        {
                            var moveTime = event.originalEvent.timeStamp - startTouchTime;
                            if(moveTime<300)
                            {
                                var touchMoveX = touch.pageX - startTouch.pageX;
                                var touchMoveY = touch.pageY - startTouch.pageY;
                                var threshold  = tabsElem.width();
                                if(touchMoveX<-threshold){
                                    tabsElem.removeClass("box-tabs-close");
                                    tabsElem.addClass("box-tabs-open");
                                    tabLayoutUpdate();
                                    accelMove.clear();
                                }
                                else if(touchMoveX > threshold/2){
                                    tabsElem.removeClass("box-tabs-open");
                                    tabsElem.addClass("box-tabs-close");
                                    tabLayoutUpdate();
                                    accelMove.clear();
                                }
                                else{
                                    accelMove.end();
                                }
                            }
                        }
                    }
                }
                else{
                    lastPosX = event.pageX;
                    lastPosY = event.pageY;
                    mouseDownFlg = false;
                    accelMove.end();
                }
                /*
                accIntervalId = setInterval(function(){
                    tabMenuY += accVY;

                    accVY = accVY - (accVY>0?0.03:-0.03);
                    if(tabMenuY < -panelElm.outerHeight()){
                        tabMenuY = boxElem.height();
                    }
                    else if(tabMenuY > boxElem.height()){
                        tabMenuY = -panelElm.height();
                    }
                    panelElm.css({
                        top:tabMenuY,
                    });
                    if(Math.abs(accVY)<0.1){
                        clearInterval(accIntervalId);
                        accIntervalId = null;
                    }
                })
                */

                return false;
            },
        });
    },
};
ko.bindingHandlers.boxTabsBtn = {
    init: function(btnElement, valueAccessor) {
        var data       = ko.unwrap(valueAccessor());
        var btnElem    = $(btnElement);
        var startTime  = null;
        var startPosX  = 0;
        var startPosY  = 0;
        var tapAct = function(){
            $.each(data.lst,function(k,wsObsv){                  
                var ws = wsObsv();
                if(ws == data.ws){
                    //表示
                    $(ws.workAreaElement).removeClass("box-workspace-hide");
                    $(ws.workAreaElement).addClass("box-workspace-disp");
                }
                else{
                    //非表示
                    $(ws.workAreaElement).removeClass("box-workspace-disp");
                    $(ws.workAreaElement).addClass("box-workspace-hide");
                }
            });
            $(".box-tabs-btn",btnElem.parent()).removeClass("box-tabs-btn-sel");
            btnElem.addClass("box-tabs-btn-sel");
        };
        if( data.lst[0] && data.lst[0]() == data.ws)
        {
            tapAct();
        }
        $(btnElement).on({
            'touchstart mousedown': function (event) {
                event.preventDefault();
                startTime = +new Date();
                startPosX  = event.pageX||event.originalEvent.touches[0].pageX;
                startPosY  = event.pageY||event.originalEvent.touches[0].pageY;
            },
            'touchmove mousemove': function (event) {
                event.preventDefault();
            },
            'touchend mouseup': function (event) {
                event.preventDefault();
                var lastTime = +new Date();
                if((lastTime - startTime) < 500){
                    var lastPosX  = event.pageX||event.originalEvent.changedTouches[0].pageX;
                    var lastPosY  = event.pageY||event.originalEvent.changedTouches[0].pageY;
                    var mvX = lastPosX - startPosX;
                    var mvY = lastPosY - startPosY;
                    if(Math.sqrt(mvX*mvX+mvY*mvY) < $(btnElement).height()){
                        tapAct();
                    }
                }
            },
        });
    },
    update: function(element, valueAccessor) {
        valueAccessor();
    }
};

ko.bindingHandlers.guide = {
    init: function(guideElement, valueAccessor, allBindings, viewModel, bindingContext) {
        var boxElem    = $(guideElement).parents(".blockBox");

        // スクロールガイド(移動の操作しやすくするためのもの＋そのうちタブ向けのボタンになるかも)
        var guidElem = $(guideElement);
        var guidLayoutUpdate = function(){
            guidElem.css({
                left:boxElem[0].clientWidth - guidElem.outerWidth()  + boxElem.scrollLeft() +"px",
                top: boxElem[0].clientHeight- guidElem.outerHeight() + boxElem.scrollTop()  +"px",
                overflow:"hidden"
            });
        };
        boxElem.scroll(function(e){
            guidLayoutUpdate();
        });
        $(window).resize(function(e){
            guidLayoutUpdate();
        });
        guidLayoutUpdate();

        var guidX=0;
        var guidY=0;
        var accVY=0;
        var isLastSizeMove=null;
        var touchMove = new TouchMove({useSelfMove:true});
        var accelMove = new AccelMove(
            function(moveInfo){
                $("body").scrollTop($("body").scrollTop()-moveInfo.deltaValues[0]);
            },
            function(speed,deltaTime){
                if(speed!=0)
                {
                    var decSpeed  = 1.5 / 1000 * deltaTime;
                    var nextSpeed = speed - ((speed>0)?decSpeed:-decSpeed);
                    if((nextSpeed>0) != (speed > 0)||
                        Math.abs(nextSpeed)<0.01)
                    {
                       nextSpeed = 0;
                    }
                    //console.log("s:"+speed+" n:"+nextSpeed+" d:"+decSpeed);
                }
                return nextSpeed;
            }
        );
        guidElem.on({
            'touchstart': function (event) {
                event.preventDefault();                    
                touchMove.start(event);
                var touchInfo = touchMove.touchInfoFing[0];
                $(this).css({
                    opacity:1.0,
                });
                if(touchInfo&&touchInfo.isFirst){
                    accelMove.start(touchInfo.ly);
                }
                return false;
            },
            'touchmove': function (event) {
                event.preventDefault();
                touchMove.move(event);

                isLastSizeMove = false;
                var touchInfo  = touchMove.touchInfoFing[0];
                if(touchInfo)
                {
                    $.each(event.originalEvent.touches,function(k,touch){
                        if(touchInfo.touchId != touch.identifier){
                            // 複数のタッチを検知したら拡縮モードにします
                            isLastSizeMove = true;
                        }
                    });
                    if(isLastSizeMove){
                        if(touchMove.opt.useSelfMove){
                            touchMove.opt.useSelfMove = false;
                            touchMove.start(event);
                        }
                        else{
                            var newH = boxElem.height()+touchInfo.dy;
                            if(newH < 50){
                                newH = 50;
                            }
                            boxElem.height(newH);
                            accelMove.clear();
                            guidLayoutUpdate();
                        }
                    }
                    else{
                        if(!touchMove.opt.useSelfMove){
                            touchMove.opt.useSelfMove = true;
                            touchMove.start(event);
                        }else{
                            if(!accelMove.isStart()){
                                accelMove.start(touchInfo.ly);
                            }
                            accelMove.move(touchInfo.ly);
                        }
                    }
                }
                return false;
            },
            'touchend': function (event) {
                event.preventDefault();
                $(this).css({
                    opacity:"0.2",
                });
                if(!isLastSizeMove){
                    //慣性スクロール開始
                    accelMove.end();
                }else{
                    accelMove.clear();
                }
                touchMove.end(event);
                return false;
            },
        });
    },
    update: function(element, valueAccessor) {
    }
};













// 設計メモ
// 管理リスト＋グローバルなブロックという形で実装
// ブロック間はグローバルにつなぎ、相互に接続も自由。
// 管理エリア毎にリストを作ってそこに格納するだけ。

// ■ブロック管理
function BlockManager(execContext){
    var self = this;

    // 
    self.execContext  = execContext;//実行環境(各種グローバルな要素を入れるテーブル)

    // ブロックのリストなど
    self.blockList = [];
    self.elementBlockLookupTbl = {};

    // ブロック作業場リストなど
    self.floatDraggingList = ko.observableArray();
    self.floatDraggingInfo = {
        fromWs:null,
        droppedWs:null,
    };
    self.blockWorkSpaceList = [];
    self.elementBlockWsLookupTbl = {};
    self.blockWsIdSeed_ = 1;

    // ■編集のモード遷移の管理用のインスタンス(タップやホールド等の管理をします)
    function EditMode(){
        var self = this;

        var targetBlock=null;
        self.setTargetBlock = function(block){
            targetBlock = block;
        };
        self.getTargetBlock = function(){
            return targetBlock;
        };
        
        // ■編集始まり待ち中？
        var nowWait_ = false;
        var nowEdit_ = false;
        self.isNowLazyEditModeStartWait = function()
        {
            return nowWait_;
        }

        // ■編集を遅延させる形で始めます
        var editModeTimeId;
        var editEndCb = null;
        self.lazyEditModeStart = function(startCb, endCb){
            // 前回の編集モードが有効なら即終わらせます
            self.lazyEditModeCancel();
            nowWait_ = true;
            // 編集モードへの移行を開始します
            // (押したりりタップ後、一定時間でキャンセルされなければ開始となります)
            if(editModeTimeId){
                clearTimeout(editModeTimeId);
                editModeTimeId = null;   
            }
            editEndCb = endCb;
            editModeTimeId = setTimeout(function(){
                nowWait_ = false;
                nowEdit_ = true;
                startCb();
            },300);
        };
        self.lazyEditModeCancel = function(){
            clearTimeout(editModeTimeId);
            editModeTimeId = null;
            nowWait_ = false;
            nowEdit_ = false;
            if(editEndCb)editEndCb();
        };

        // ■ホールド検知を開始します
        var holdModeTimeId;
        self.holdModeFlag = true;
        var holdEndCb = null;
        self.lazyHoldModeStart = function(startCb,endCb){
            if(holdModeTimeId){
                clearTimeout(holdModeTimeId);
                holdModeTimeId = null;
            }
            holdEndCb = endCb;
            holdModeTimeId = setTimeout(function(){
                self.lazyEditModeCancel();
                self.holdModeFlag = true;
                if(startCb){
                    startCb();
                }
            },500);
        };
        self.lazyHoldModeCancel = function(){
            clearTimeout(holdModeTimeId);
            holdModeTimeId = null;
            if(holdEndCb){
                holdEndCb();
            }
            holdEndCb = null;
            self.holdModeFlag = false;
        };
    };
    self.editMode = new EditMode();


    //■ ブロック周りの便利系な処理

    // 指定のブロックの繋がっているブロックの塊の一番最上流のブロックを取得します
    self.getLumpTopBlock = function(block)
    {
        // 一番上のブロックを探します
        var topBlock = block;
        // まずは値ブロックの場合は接続先をたどります
        while(topBlock.valueOut && topBlock.valueOut.block)
        {
            topBlock = topBlock.valueOut.block;
        }
        // つぎに通常用ブロックの場合は接続元を辿ります
        while(topBlock.in && topBlock.in.blockObsv())
        {
            topBlock = topBlock.in.blockObsv();
        }
        return topBlock;
    }

    // 指定のブロックがブロックの塊の中に含まれているかチェックします
    self.checkContainLumpBlock = function(checkBlock,lumbBlock)
    {
        // 一番上のブロックを探します
        var topBlock = self.getLumpTopBlock(lumbBlock);
        var bFind = false;
        self.traverseUnderBlock( topBlock,{
            blockCb:function(block){
                if(block == checkBlock){
                    bFind = true;
                    return false;
                }
            },
        });
        return bFind;
    };
    // 指定ブロック以下を再帰的に辿ります
    // (※値ブロックは入力が辿られます)
    self.traverseUnderBlock = function(block,callbacks)
    {
        var recv = function(block){
            if(callbacks.blockCb){
                if(false===callbacks.blockCb(block)){
                    return false;
                }
            }
            var isExit = false;
            $.each(block.valueInTbl,function(k,valueIn){
                if(valueIn.blockObsv())
                {
                    if(callbacks.valueInCb){
                        if(false===callbacks.valueInCb(block, k, valueIn.blockObsv(), valueIn)){
                            isExit = true;
                            return false;
                        }
                    }
                    if(false===recv(valueIn.blockObsv())){
                        isExit = true;
                        return false;
                    }
                }
            });
            if(isExit){
                return false;
            }
            $.each(block.scopeTbl,function(k,scope){
                if(scope.scopeOut.blockObsv())
                {
                    if(callbacks.scopeOutCb){
                        if(false===callbacks.scopeOutCb(block, k, scope.scopeOut.blockObsv(), scope)){
                            isExit = true;
                            return false;
                        }
                    }
                    if(false===recv(scope.scopeOut.blockObsv())){
                        isExit = true;
                        return false;
                    }
                }
            });
            if(isExit){
                return false;
            }
            if(block.out && block.out.blockObsv()){
                if(callbacks.outCb){
                    if(false===callbacks.outCb(block, block.out.blockObsv(), block.out)){
                        isExit = true;
                        return false;
                    }
                }
                if(false===recv(block.out.blockObsv())){
                    isExit = true;
                    return false;
                }
            }
            if(isExit){
                return false;
            }
        };
        recv(block);
    };

    //■ シリアライズ回り

    // ブロックの塊(指定ブロック以下全て)をJSON用データに変換します
    self.toJSON_LumpBlocks = function(block){
        var recv = function(block){
            var json={
                blkWId:block.blockTemplate.blockOpt.blockWorldId,
                valTbl:{},
                scpTbl:{},
            };
            $.each(block.valueInTbl,function(k,valueIn){
                json.valTbl[k]={};
                if(valueIn.blockObsv()){
                    json.valTbl[k].block=recv(valueIn.blockObsv());
                }
                if(!valueIn.dataTemplate.dropOnly)//都合により今はdropOnlyは除外します(保存しなくても動くのと画像データとか入れてるので保存すると落ちる場合が…)
                {
                    json.valTbl[k].value=valueIn.valueObsv();
                }
            });
            $.each(block.scopeTbl,function(k,scope){
                if(scope.scopeOut.blockObsv())
                {
                    json.scpTbl[k] = recv(scope.scopeOut.blockObsv());
                }
            });
            if(block.out && block.out.blockObsv()){
                json.out = recv(block.out.blockObsv());
            }
            return json;
        };
        var json = recv(block);
        json.posX=block.posX()*block.pix2em;
        json.posY=block.posY()*block.pix2em;
        return json;
    };

    // JSON用データからブロックの塊を復元します(塊でなくてもフォーマットは変わりません)
    self.fromJSON = function(json){
        var recv = function(json){
            var block = self.createBlockIns( json.blkWId );
            $.each(json.valTbl,function(k,valJson){
                if(block.valueInTbl[k]){
                    if(valJson.value){
                        block.valueInTbl[k].valueObsv( valJson.value );
                    }
                    if(valJson.block){
                        block.connectValueIn(k,recv(valJson.block));
                    }
                }
            });
            $.each(json.scpTbl,function(k,scpJson){
                if(block.scopeTbl[k]){
                    block.connectScopeOut(k,recv(scpJson));
                }
            });
            if(block.out && json.out){
                block.connectOut(recv(json.out));
            }
            return block;
        };
        var block = recv(json);
        if(json.posX)block.posX(json.posX/block.pix2em);
        if(json.posY)block.posY(json.posY/block.pix2em);
        return block;
    };

    //■ 
    var getHitBlock = function(block,movePivotPos){
        var tgtBlockWs = self.findBlockWorkSpaceByBlock(block);
        if(!tgtBlockWs)
        {
            //所属してる作業場があったらその中で判定します
            //所属が無いときは移動の中心(指とかマウス)が重なる作業場から判定します
            $.each(self.blockWorkSpaceList,function(k,blockWs){
                var offs1 = $(blockWs.workAreaElement).offset();
                var w1    = $(blockWs.workAreaElement).width();
                var h1    = $(blockWs.workAreaElement).height();
                if(movePivotPos.y < offs1.top + h1&&
                   offs1.top      < movePivotPos.y&&
                   movePivotPos.x < offs1.left + w1&&
                   offs1.left     < movePivotPos.x)
                {
                    tgtBlockWs = blockWs;
                    return false;
                }
            });
        }
        if(tgtBlockWs){
            return tgtBlockWs.getHitBlock(block);
        }
    };
    
    // 位置のレイアウト処理です(サイズはカスタムバインドで処理します)
    self.updatePositionLayout = function(updateBlock,useGpu){
        //console.log("updatePositionLayout");

        // 更新する一番上のブロックを探します
        var topBlock = self.getLumpTopBlock(updateBlock);
        var workSpace = self.findBlockWorkSpaceByBlock(topBlock);
        var offsetX = 0;
        var offsetY = 0;
        if(workSpace){
            offsetX = workSpace.offsetX();
            offsetY = workSpace.offsetY();
        }

        // レイアウトします
        self.traverseUnderBlock(topBlock,{
            blockCb:function(block){
                var x = block.posX();
                var y = block.posY();
                if(useGpu){
                    block.transformStyle("translate3d("+x+"px,"+y+"px,0)");
                }
                else{
                    block.transformStyle("translate("+x+"px,"+y+"px)");
                }
            },
            // 位置のみなのでブロック内の処理順は自由にやれます
            valueInCb:function(block,k,valueInBlock,valueIn){
                var blockA = block;
                var blockB = valueInBlock;
                blockB.posX(
                    blockA.posX() + valueIn.blockLocalX()
                );
                blockB.posY(
                    blockA.posY() + valueIn.blockLocalY()
                );
            },
            scopeOutCb:function(block,k,scopeOutBlock,scope){
                var blockA = block;
                var blockB = scopeOutBlock;
                var blkConnectorHalfMargin = 0.25 / block.pix2em;
                blockB.posY(
                    blockA.posY() + scope.rowBlockLocalY() + blkConnectorHalfMargin
                );
                blockB.posX(
                    blockA.posX() + blockA.indentWidth
                );
            },
            outCb:function(block,outBlock,out){
                var blockA = block;
                var blockB = outBlock;
                var elmA = blockA.element;
                var elmB = blockB.element;
                //var marginConnector = 0.5 / blockB.pix2em;
                blockB.posY(
                    blockA.posY() + blockA.blockHeight()// + marginConnector
                );
                blockB.posX(
                    blockA.posX()
                );
            },
        });
    };

    self.moveStart = function(block,uiOffsPosition){
        block.clearIn();
        block.clearValueOut();
        // 動かすモノをつながっている順に後ろに付け替えます
        self.blockList.splice( self.blockList.indexOf(block), 1 );
        self.blockList.push(block);
        var recv = function(block){
            $.each(block.valueInTbl,function(k,valueIn){
                if(valueIn.blockObsv())
                {
                    self.blockList.splice( self.blockList.indexOf(valueIn.blockObsv()), 1 );                
                    self.blockList.push( valueIn.blockObsv() );
                    recv(valueIn.blockObsv());
                }
            });
            $.each(block.scopeTbl,function(k,scope){
                if(scope.scopeOut.blockObsv())
                {
                    self.blockList.splice( self.blockList.indexOf(scope.scopeOut.blockObsv()), 1 );                
                    self.blockList.push( scope.scopeOut.blockObsv() );
                    recv(scope.scopeOut.blockObsv());
                }
            });
            if(block.out && block.out.blockObsv()){
                self.blockList.splice( self.blockList.indexOf(block.out.blockObsv()), 1 );
                self.blockList.push( block.out.blockObsv() );
                recv(block.out.blockObsv());
            }
        };
        recv(block);
        // zIndexを振りなおします
        var zIndex = 100;
        $.each(self.blockList,function(k,block){
            $(block.element).css({zIndex:zIndex});
            zIndex+=1;
        });
    };
    self.move = function(block,scaledUiRelativePosition){
        var workSpace = self.findBlockWorkSpaceByBlock(block);
        var offsetX = 0;
        var offsetY = 0;
        var posX = scaledUiRelativePosition.left;
        var posY = scaledUiRelativePosition.top;
        if(workSpace){
            //posX = posX - $(workSpace.workAreaElement).offset().left;
            //posY = posY - $(workSpace.workAreaElement).offset().top;
            posX = posX - workSpace.offsetX();
            posY = posY - workSpace.offsetY();
        }
        block.posX(posX);
        block.posY(posY);
        self.updatePositionLayout(block,true);
        self.dropGuideUpdate(block);
    };
    self.moveStop = function(block){
        var workSpace = self.findBlockWorkSpaceByBlock(block);
        self.updatePositionLayout(block,false);
        self.dropConnectUpdate(block,{x:0,
                                      y:0 });
    };

    // ドロップする場所のガイドを更新します
    self.dropGuideUpdate = function(block){

    };

    // ドロップした際の接続の更新を行います
    self.dropConnectUpdate = function(block,movePivotPos)
    {        
        var hit = getHitBlock(block,movePivotPos);
        if(hit)
        {
            if(hit.valueName){
                hit.hitBlock.connectValueIn(hit.valueName, hit.srcBlock);
            }
            else if(hit.scopeName){
                hit.hitBlock.connectScopeOut(hit.scopeName, hit.srcBlock);
            }
            else if(hit.isSrcIn){
                hit.hitBlock.connectOut(hit.srcBlock);
            }
            else{
                hit.srcBlock.connectOut(hit.hitBlock);
            }
            self.updatePositionLayout(block,false);
        }
        // zIndexを振りなおします
        var zIndex = 100;
        $.each(self.blockList,function(k,block){
            $(block.element).css({zIndex:zIndex});
            zIndex+=1;
        });
    };


    // ■ ブロック用のカスタムバインド
    var blockIdSeed_ = 1;
    ko.bindingHandlers.blockSetup = {
        init: function(element, valueAccessor) {
            // ユーザーデータにIDを付加します
            $(element).data("blockId",blockIdSeed_++);
            // ブロックの要素生成時の初期化を行います
            var blockIns = ko.unwrap(valueAccessor());
            blockIns.setup(element);
            // ブロックを要素から引くためにテーブルに追加します
            self.elementBlockLookupTbl[$(element).data("blockId")] = blockIns;
        },
        update: function(element, valueAccessor) {
        }
    };
    ko.bindingHandlers.updateBlockSizeLayout = {
        init: function(element, valueAccessor) {
        },
        update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            //console.log("updateBlockSizeLayout");
             
            var block = ko.utils.unwrapObservable(valueAccessor());
            // ブロック内のデータの通知を受けることを伝えます
            $.each(block.valueDataObsvTbl,function(k,v){
                v();
            });
            $.each(block.valueInTbl,function(k,v){
                v.blockObsv();
            });
            var calcHitAreaRect = function(block,hitArea){
                var scaleRootElm = $(block.element).parents(".box-workspace");
                var matrixRegex  = /matrix\((-?\d*\.?\d+),\s*0,\s*0,\s*(-?\d*\.?\d+),\s*0,\s*0\)/;
                var transformMtx = $(scaleRootElm).css('transform');
                var matches      = transformMtx && transformMtx.match(matrixRegex);
                var scaleX=1;
                var scaleY=1;
                if(matches){
                    scaleX = parseFloat(matches[1]);
                    scaleY = parseFloat(matches[2]);
                }
                return {
                    x:(hitArea.offset().left- $(block.element).offset().left)/scaleX,
                    y:(hitArea.offset().top - $(block.element).offset().top )/scaleY,
                    w:hitArea.width(),
                    h:hitArea.height(),
                };
            };            
            // レイアウトします
            var blkConnectorHalfMargin = 0.25 / block.pix2em;
            var blkLocalPosY  = 0;
            var blkSizeW      = 0;
            if(block.in){
                //コネクタの半分のマージンを足します(繋がると一つ分になる想定)
                blkLocalPosY += blkConnectorHalfMargin;
            }
            $(".blockRow",element).each(function(rowIndex,elemR){
                var rowContent = block.rowContents[rowIndex];
                var rowSizeH   = block.minimumRowHeight;
                var cellXMargin = 0.10 / block.pix2em;
                var blkLocalPosX = 0;
                if(rowContent.expressions)
                {
                    $(".blockCell",elemR).each(function(k,elemCell){
                        
                        if(k!=0){
                            blkLocalPosX += cellXMargin;
                        }
                        var valueIn;
                        var dataName = $(elemCell).attr("id");
                        if(dataName)
                        {
                            valueIn = block.valueInTbl[dataName];
                            valueIn.blockLocalX( blkLocalPosX );
                            valueIn.blockLocalY( blkLocalPosY );
                            valueIn.hitArea
                            //$(".hitAreaValueIn#"+dataName,block.element)
                            .css(
                                 {left:blkLocalPosX,
                                  top :blkLocalPosY,}
                            );
                            valueIn.hitAreaRect = calcHitAreaRect(block,valueIn.hitArea);
                        }
                        $(elemCell).css({left:blkLocalPosX});
                        var cellW = $(elemCell).outerWidth();
                        var cellH = $(elemCell).outerHeight();
                        if(dataName)
                        {
                            valueIn = block.valueInTbl[dataName];
                            var nestValueMargin = 0.20 / block.pix2em;
                            if(valueIn.blockObsv())
                            {
                                cellW = Math.max(cellW, valueIn.blockObsv().blockWidth()  + nestValueMargin);
                                cellH = Math.max(cellH, valueIn.blockObsv().blockHeight() + nestValueMargin);
                            }
                            //cellH += 0.2 / block.pix2em;
                        }
                        blkLocalPosX += cellW;
                        rowSizeH = Math.max(rowSizeH,cellH);
                    });
                    rowContent.rowHeight(rowSizeH);
                }
                else if(rowContent.scopeOut){
                    var scopeBlocksH = 0;
                    var tmpOutBlock = rowContent.scopeOut.blockObsv();
                    while(tmpOutBlock)
                    {
                        scopeBlocksH = scopeBlocksH + tmpOutBlock.blockHeight();
                        if(tmpOutBlock.out && tmpOutBlock.out.blockObsv()){
                            tmpOutBlock = tmpOutBlock.out.blockObsv();
                        }else{
                            tmpOutBlock = null;
                        }
                    }
                    //上辺の出力コネクタ用のマージンを加えます
                    scopeBlocksH += blkConnectorHalfMargin;
                    rowSizeH = Math.max( rowSizeH, scopeBlocksH );
                    rowContent.scopeOut.hitAreaRect = calcHitAreaRect(block,rowContent.scopeOut.hitArea);
                }
                else if(rowContent.space){
                    rowSizeH = Math.max( rowSizeH, 1.0 / block.pix2em );
                }
                rowContent.rowHeight(rowSizeH);
                rowContent.rowBlockLocalY(blkLocalPosY);
                $(elemR).css({
                    top:    blkLocalPosY,
                    height: rowSizeH,
                    width:  blkLocalPosX});
                blkLocalPosY += $(elemR).outerHeight();

                blkSizeW = Math.max(blkSizeW,$(elemR).outerWidth());
            });
            if(block.out){
                blkLocalPosY += blkConnectorHalfMargin;
            }
            $(element).css({height:blkLocalPosY,width:blkSizeW});
            var blkSizeH = blkLocalPosY;
            block.blockHeight(blkSizeH);
            block.blockWidth (blkSizeW);


            if(block.valueOut){
                block.valueOut.hitAreaRect = calcHitAreaRect(block,block.valueOut.hitArea);
            }
            if(block.in){
                block.in.hitAreaRect = calcHitAreaRect(block,block.in.hitArea);
            }
            $(".blockRow",element).each(function(rowIndex,elemR){
                var rowContent = block.rowContents[rowIndex];
                if(rowContent.expressions){
                    $(".blockCell",elemR).each(function(k,elemCell){                        
                        var dataName = $(elemCell).attr("id");
                        if(dataName)
                        {
                            var valueIn = block.valueInTbl[dataName];
                            valueIn.hitAreaRect = calcHitAreaRect(block,valueIn.hitArea);
                        }
                    });
                }
                else if(rowContent.scopeOut){
                    rowContent.scopeOut.hitAreaRect = calcHitAreaRect(block,rowContent.scopeOut.hitArea);
                }
            });
            if(block.out){
                block.out.hitAreaRect = calcHitAreaRect(block,block.out.hitArea);
                /*
                var elm=$("<div class='testBox'></div>");
                elm.css({left:block.out.hitAreaRect.x + block.posX.peek(),
                         top: block.out.hitAreaRect.y + block.posY.peek(),
                         width:  block.out.hitAreaRect.w,
                         height: block.out.hitAreaRect.h,});
                $(block.element.parentElement.parentElement).append(elm);
                */
            }
        }
    };


    // ■ブロック定義の登録とインスタンス生成など

    self.blockDefTbl = {};

    // ブロック定義の登録をしますテンプレートとコールバックの登録
    self.registBlockDef = function(blockTemplate, callback){
        if(!blockTemplate.blockOpt.blockWorldId){
            alert("テンプレートにblockWorldIdがありません。"+JSON.stringify(blockTemplate));
            return;
        }
        if(self.blockDefTbl[blockTemplate.blockOpt.blockWorldId]){
            //TODO:多言語対応時には重なる事あり
            alert("定義登録でblockWorldIdが重なりました。id:"+blockTemplate.blockOpt.blockWorldId);
            return;
        }
        self.blockDefTbl[blockTemplate.blockOpt.blockWorldId] = {
            blockTemplate:blockTemplate, 
            callback:     callback,
        };
    };

    // ブロックの世界対応IDからブロックのインスタンスを作ります
    self.createBlockIns = function(blockWorldId){
        var blockDef = self.blockDefTbl[blockWorldId];
        if(!blockDef){
            alert("blockWorldIdに一致する定義がありません。id:"+blockWorldId);
            return;
        }
        var newBlockIns = new Block(self, blockDef.blockTemplate, blockDef.callback);
        self.blockList.push(newBlockIns);
        return newBlockIns;
    };

    // ■ブロック作業場のインスタンス生成など

    // ブロックの作業場のインスタンスを生成します
    self.createBlockWorkSpaceIns = function(dragScopeName,workspaceName){
        var blkWsIns = new BlockWorkSpace(self, dragScopeName, workspaceName);
        self.blockWorkSpaceList.push(blkWsIns);
        return blkWsIns;
    };

    // ブロックからブロックの作業場を探します
    self.findBlockWorkSpaceByBlock = function(block){
        for(var ii=0; ii < self.blockWorkSpaceList.length ; ii++){
            if(self.blockWorkSpaceList[ii].isContainsBlock(block)){
                return self.blockWorkSpaceList[ii];
            }
        }
    };


    // ■以下内部的な連携のための処理


    // ■ブロック移動・編集・ドラッグなどの操作

    // contentEditable(テキスト入力)属性の操作用です
    // .editableContent というクラスが付加された要素を操作します
    function ModEditableElement()
    {
        var self = this;

        var editableElm = null;

        self.setElement = function(element)
        {
            self.clearElement();
            editableElm = $(element);
            if(editableElm && editableElm.length>0)
            {
                //
                $(editableElm).attr({contenteditable:"true"});

//$(editableElm).append("<input>");

                // curEditMode を割り当てます
                $(editableElm).addClass("curEditMode");
                // 編集対象へフォーカスをあてます
                editableElm[0].focus();
                // 最後にカーソルを持っていきます
                setEndOfContenteditable_(editableElm[0]);
                // イマイチ環境依存してうまく動かないのでカット
                //$(editableElm[0]).blur(function(){
                //    clearAllEditMode_();
                //});

                setTimeout(function(){
                    if(editableElm)
                    {
                        // curEditMode を割り当てます
                        $(editableElm).addClass("curEditMode");
                        // 編集対象へフォーカスをあてます
                        editableElm[0].focus();
                        // 最後にカーソルを持っていきます
                        setEndOfContenteditable_(editableElm[0]);
                        // イマイチ環境依存してうまく動かないのでカット
                        //$(editableElm[0]).blur(function(){
                        //    clearAllEditMode_();
                        //});
                    }
                },300)
            }
        };
        self.clearElement = function()
        {
            if(editableElm && editableElm.length>0)
            {
                editableElm.removeAttr("contentEditable");
                // curEditMode を外します
                $(editableElm).removeClass("curEditMode");
            }
            editableElm = null;
        };

        // 操作対象の要素を探します
        // (当初はcontentEditable属性をもとにやりましたが何かと大変だったのでやめました)
        self.findEditableElement = function(element){
            if($(element).hasClass("editableContent")){
                return $(element);
            }
            return $(".editableContent",element);
        };

        // http://stackoverflow.com/questions/1125292/how-to-move-cursor-to-end-of-contenteditable-entity/3866442#3866442
        function setEndOfContenteditable_(contentEditableElement)
        {
            var range,selection;
            if(document.createRange)//Firefox, Chrome, Opera, Safari, IE 9+
            {
                range = document.createRange();//Create a range (a range is a like the selection but invisible)
                range.selectNodeContents(contentEditableElement);//Select the entire contents of the element with the range
                range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
                selection = window.getSelection();//get the selection object (allows you to change selection)
                selection.removeAllRanges();//remove any selections already made
                selection.addRange(range);//make the range you have just created the visible selection
            }
            else if(document.selection)//IE 8 and lower
            { 
                range = document.body.createTextRange();//Create a range (a range is a like the selection but invisible)
                range.moveToElementText(contentEditableElement);//Select the entire contents of the element with the range
                range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
                range.select();//Select the range (make it the visible selection
            }
        }
    };

    // １つのブロック内のcontentEditable要素の編集を管理します
    function BlockEditableElemEdit(block,selectElem)
    {
        var self = this;
 
        var modEditableElm_ = new ModEditableElement();
       
        var findEditableElm_ = function(block,selectElem)
        {
            // 編集対象を探します
            var editableElm;
            editableElm = modEditableElm_.findEditableElement(selectElem);
            if(!editableElm||editableElm.length==0){
                editableElm = modEditableElm_.findEditableElement(block.element);
            }
            if(editableElm.length>0)
            {
                return $(editableElm[0]);
            }
        };
        var setEditMode_ = function(tgtBlock){
            $(tgtBlock.element).addClass("curEditModeForDraggable");
            // 対象ブロックのドラッグを無効化します
            $(tgtBlock.element).draggable('disable');
        };
        var clearAllEditMode_ = function(){
            var nowEditableDraggableElm = $(".curEditModeForDraggable");
            nowEditableDraggableElm.removeClass("curEditModeForDraggable");
            // 外れた要素のドラッグを有効化します
            nowEditableDraggableElm.draggable('enable');
        };

        self.isNowEdit = function(){
            var editableElm = findEditableElm_(block,selectElem);
            return $(editableElm).hasClass("curEditMode");
        };
 
        self.startEdit = function()
        {
            // 編集対象を探して、あれば選択します
            var editableElm = findEditableElm_(block,selectElem);
            if(editableElm)
            {
                // 編集対象をセットします
                clearAllEditMode_();
                setEditMode_(block);

                // 編集対象へフォーカスをあてます
                modEditableElm_.setElement(editableElm);
            }
        };
        self.endEdit = function()
        {
            clearAllEditMode_();
            modEditableElm_.clearElement();
        };
    };

    // 
    var setDragGuide = function(block)
    {
        // ドラッグ先のガイド表示をします
        if(block.in){
            $(".hitAreaOut").each(function(k,elm){
                var tgtElm = $(elm).parents(".block");
                var tgtBlock = self.elementBlockLookupTbl[$(tgtElm).data("blockId")];
                if(!tgtBlock.out.blockObsv()){
                    $(elm).addClass("hitAreaDragging");
                }
            });
            $(".hitAreaScopeOut").addClass("hitAreaDragging");
        }
        if(block.out){
            $(".hitAreaIn").addClass("hitAreaDragging");
        }
        if(block.valueOut)
        {
            $(".hitAreaValueIn").each(function(k,elm){
                var tgtElm = $(elm).parents(".block");
                var tgtBlock = self.elementBlockLookupTbl[$(tgtElm).data("blockId")];
                var tgtDataName = $(elm).attr("id");
                if(tgtBlock)
                {
                    if(tgtBlock.getTypeAccept(tgtDataName,block))
                    {
                        $(elm).addClass("hitAreaDragging");
                    }
                }
            });
            //$(".hitAreaValueIn").addClass("hitAreaDragging");
            //$(".hitAreaValueOut",block.element).addClass("hitAreaDragging");
        }
        var topBlock = self.getLumpTopBlock(block);        
        self.traverseUnderBlock(topBlock,{
            blockCb:function(block){
                $(".hitAreaDragging",block.element).removeClass("hitAreaDragging");
            },
        });
        var bottomBlock = topBlock;
        while(bottomBlock.out && bottomBlock.out.blockObsv()){
            bottomBlock = bottomBlock.out.blockObsv();
        }
        if(topBlock.in){
            $(".hitAreaIn",block.element).addClass("hitAreaDragging");
        }
        if(bottomBlock.out){
            $(".hitAreaOut",bottomBlock.element).addClass("hitAreaDragging");
        }
    };
    var clearDragGuide = function(){
        $(".hitAreaDragging").removeClass("hitAreaDragging");
    };

    // 別ボックスへ移動するためのドラッグ向けのリストに追加
    self.addFloatDraggingList = function(newBlock){
        self.traverseUnderBlock(newBlock,{
            blockCb:function(block){
                block.setCloneDragMode(false);
                block.setNoConnectMode(false);                
                self.floatDraggingList.push(ko.observable(block));
            },
        });
    };
    self.popFloatDraggingListByElem = function(elem){
        for(var ii=0; ii < self.floatDraggingList().length ; ii+=1)
        {
            var blockObsv = self.floatDraggingList()[ii];
            if($(blockObsv().element).get(0) == $(elem).get(0))
            {
                var block = blockObsv();
                self.traverseUnderBlock(block,{
                    blockCb:function(block){
                        //TODO:検索効率悪そうなので直したい
                        for(var ii=0; ii < self.floatDraggingList().length ; ii+=1)
                        {
                            var blockObsv = self.floatDraggingList()[ii];
                            if(blockObsv() == block){
                                self.floatDraggingList.splice(ii,1);
                                break;
                            }
                        }
                        //描画を最後尾に順入れ替えます
                        self.blockList.splice( self.blockList.indexOf(block), 1 );
                        self.blockList.push(block);                        
                    },
                });
                return block;
            }
        }
    };

    // ワークスペースに対するドロップ処理
    self.dropWorkspace = function(workspace,block)
    {
        var findBlockTop = block;
        var dropBlockTop = findBlockTop.cloneThisBlockAndConnectBlock();

        workspace.addBlock( dropBlockTop );

        var areaElmOffset = $(workspace.workAreaElement).offset();

        var dropX = ($(findBlockTop.element).offset().left - areaElmOffset.left);
        var dropY = ($(findBlockTop.element).offset().top  - areaElmOffset.top );
        dropX = dropX * 1/workspace.scale() - workspace.offsetX();
        dropY = dropY * 1/workspace.scale() - workspace.offsetY();
        dropBlockTop.posX(dropX);
        dropBlockTop.posY(dropY);

        self.updatePositionLayout( dropBlockTop, false );
        self.dropConnectUpdate( dropBlockTop );
    };
    // ゴミ箱に対するドロップ
    self.dropTrashbox = function(ui)
    {
//        self.floatDraggingInfo.droppedWs = workspace;

        var findBlockTop = self.popFloatDraggingListByElem( ui.helper.get(0) );
/*
        var dropBlockTop = findBlockTop.cloneThisBlockAndConnectBlock();

        workspace.addBlock( dropBlockTop );

        var areaElmOffset = $(workspace.workAreaElement).offset();

        var dropX = (ui.offset.left - areaElmOffset.left);
        var dropY = (ui.offset.top  - areaElmOffset.top );
        dropX = dropX * 1/workspace.scale() - workspace.offsetX();
        dropY = dropY * 1/workspace.scale() - workspace.offsetY();
        dropBlockTop.posX(dropX);
        dropBlockTop.posY(dropY);

        self.updatePositionLayout( dropBlockTop, false );
        self.dropConnectUpdate( dropBlockTop );
*/
    };

    var isFloatDragMode = false;

    // ブロックに対するタッチとマウス関連の操作をセットアップします
    self.setupBlockTouchAndMouseAction = function(block)
    {
        var blockElem  = $(block.element);
        // ■タップ・マウス操作
        var ignoreMouseDown = false;
        blockElem.on({
           'touchstart mousedown': function (e) {
              if(["BUTTON","SELECT",
                  "OPTION"].indexOf($(e.target).prop("tagName"))>=0)
              {
                 //input系の要素に対する操作はデフォルト挙動とします
                 return ;
              }
              e.preventDefault();
              if(e.originalEvent.fromTouch){
                  //タッチをマウスでシミュレーション時のイベントは無視します
                  return;
              }
              if(ignoreMouseDown)return;
              if(block != self.editMode.getTargetBlock()){
                  self.editMode.lazyEditModeCancel();
              }
              if(self.editMode.isNowLazyEditModeStartWait()){
                  //遅延開始待ち中に再度ダウンを検知したら解除します(ダブルタップなどだと思われるので)
                  self.editMode.lazyEditModeCancel();
                  // ダブルタップ扱いにします
                  // ■ブロックの実行
                  block.deferred();
              }
              else{
                  // タップ後の遅延開始でブロック編集を開始します
                  var blockEditableElemEdit = new BlockEditableElemEdit(block,e.target);
                  if(blockEditableElemEdit.isNowEdit()){
                      return;
                  }
                  self.editMode.setTargetBlock(block);
                  self.editMode.lazyEditModeStart(
                      blockEditableElemEdit.startEdit,
                      blockEditableElemEdit.endEdit
                  );
                  // ホールドで作業場間のドラッグ操作を開始します
                  blockElem.addClass("holdModeStart");
                  self.editMode.lazyHoldModeStart(function(){
                      isFloatDragMode = true;
                      ignoreMouseDown = true;
                      blockElem.trigger(e);
                      ignoreMouseDown = false;
                      blockElem.removeClass("holdModeStart");
                      blockElem.addClass("holdMode"); 
                  },function(){
                      blockElem.removeClass("holdModeStart");
                      blockElem.removeClass("holdMode");
                  });
              }
              //return false;
            },
            'touchmove mousemove': function (e) {
              if(e.originalEvent.fromTouch){
                  //タッチをマウスでシミュレーション時のイベントは無視します
                  return;
              }
              //event.preventDefault();
            },
            'mouseout': function (e) {
              if(e.originalEvent.fromTouch){
                  //タッチをマウスでシミュレーション時のイベントは無視します
                  return;
              }
            },
            'touchend mouseup': function (e) {
              if(["BUTTON","SELECT",
                  "OPTION"].indexOf($(e.target).prop("tagName"))>=0)
              {
                 return ;
              }
              if(e.originalEvent.fromTouch){
                  //タッチをマウスでシミュレーション時のイベントは無視します
                  return;
              }
              //アップを検知したらホールドモードはキャンセルされます
              self.editMode.lazyHoldModeCancel();
            },
        });
        // 
        var dragInfo   = null;
        blockElem
          .draggable({
              scroll:false,
              cancel:".noDrag,input,textarea,button,select,option",
              helper:function(e){
                  self.editMode.lazyHoldModeCancel();
                  dragInfo = {
                      targetBlock:null,
                      srcBlock:null,
                      cloneBlock:null,
                      blockWs:null,
                  };
                  dragInfo.srcBlock = block;
                  if(block.isCloneDragMode || isFloatDragMode){
                      // 自ボックスの外にも移動できるモード
                      // ブロックを複製をして浮遊ドラッグリストに追加します
                      dragInfo.targetBlock = dragInfo.cloneBlock = block.cloneThisBlockAndConnectBlock();
                      self.addFloatDraggingList(dragInfo.cloneBlock);
                      return dragInfo.cloneBlock.element;
                  }
                  else{
                      //自ボックスの内限定で移動できるモード
                      dragInfo.targetBlock = block;
                      dragInfo.blockWs = self.findBlockWorkSpaceByBlock(block);
                      return this;
                  }
              },
              start:function(event, ui){
                  self.editMode.lazyEditModeCancel();
                  dragInfo.click = {
                      x:event.clientX, 
                      y:event.clientY
                  };
                  dragInfo.clickOffs = {
                      x:event.pageX - $(dragInfo.srcBlock.element).offset().left, 
                      y:event.pageY - $(dragInfo.srcBlock.element).offset().top,
                  };
                  self.moveStart(dragInfo.targetBlock, ui.offset);
                  if(dragInfo.cloneBlock){
                      // 複製元ブロックを半透明表示に変更して接続不可にします
                      if(!dragInfo.srcBlock.isCloneDragMode)
                      {
                          self.traverseUnderBlock(dragInfo.srcBlock,{
                              blockCb:function(block){
                                  //$(block.element).hide();
                                  block.setNoConnectMode(true);
                                  $(block.element).css({opacity:0.2});
                              },
                          });
                      }
                  }
                  // ドラッグ先のガイド表示をします
                  setDragGuide(dragInfo.targetBlock);
              },
              drag:function(event, ui){
                  if(!dragInfo){
                      return;
                  }                  
                  // This is the parameter for scale()
                  var zoom  = dragInfo.blockWs? dragInfo.blockWs.scale() : 1.0;
                  var original = ui.originalPosition;
                  // jQuery will simply use the same object we alter here
                  ui.position = {
                      left: (event.clientX - dragInfo.click.x + original.left) / zoom,
                      top:  (event.clientY - dragInfo.click.y + original.top ) / zoom
                  };
                  self.move(dragInfo.targetBlock, ui.position);
                  ui.position = {
                      left: 0,
                      top:  0,
                  };
                  //ゴミ箱
                  if(dragInfo.cloneBlock)
                  {
                      $.each(self.blockWorkSpaceList,function(k,ws){
                          if($(ws.workAreaElement).css("display")=='none'){
                              return;
                          }
                          if(ws.dragScopeName=='noDroppable'){
                              return;
                          }
                          var wsTopElm = $(ws.workAreaElement).parent();
                          var trashBox = $(".box-trash-box",wsTopElm);
                          if($(trashBox).length>0)
                          {
                              var x0 = $(trashBox).offset().left;
                              var y0 = $(trashBox).offset().top;
                              var x1 = x0+$(trashBox).outerWidth();
                              var y1 = y0+$(trashBox).outerHeight();
                              if(x0 < event.pageX && y0 < event.pageY&&
                                 x1 > event.pageX && y1 > event.pageY)
                              {
                                  trashBox.addClass("box-trash-box-over");
                              }
                              else
                              {
                                  trashBox.removeClass("box-trash-box-over");
                              }
                          }
                      });
                  }
              },
              stop:function(event, ui){
                  clearDragGuide();
                  if(!dragInfo){
                      return;
                  }
                  // フロートリストからのドロップ処理
                  if(dragInfo.cloneBlock)
                  {
                      var zoom  = dragInfo.blockWs? dragInfo.blockWs.scale() : 1.0;
                      var original = ui.originalPosition;
                      $.each(self.blockWorkSpaceList,function(k,ws){
                          if($(ws.workAreaElement).css("display")=='none'){
                              return;
                          }
                          if(ws.dragScopeName=='noDroppable'){
                              //TODO:droppableを使っていた旧仕様の名残なので、ちゃんと活用するならここは、
                              //TODO:ブロックにも属性もたせて通常は何も無し、特別指定があれば制限かけるみたいなのがよさそう。
                              return;
                          }
                          //ゴミ箱
                          var wsTopElm = $(ws.workAreaElement).parent();
                          var trashBox = $(".box-trash-box",wsTopElm);
                          if($(trashBox).length>0)
                          {
                              trashBox.removeClass("box-trash-box-over");
                              var x0 = $(trashBox).offset().left;
                              var y0 = $(trashBox).offset().top;
                              var x1 = x0+$(trashBox).outerWidth();
                              var y1 = y0+$(trashBox).outerHeight();
                              if(x0 < event.pageX && y0 < event.pageY&&
                                 x1 > event.pageX && y1 > event.pageY)
                              {
                                  if(!dragInfo.srcBlock.isCloneDragMode)
                                  {
                                      var srcWs = self.findBlockWorkSpaceByBlock(dragInfo.srcBlock);
                                      srcWs.removeBlock(dragInfo.srcBlock);
                                  }
                                  self.popFloatDraggingListByElem( dragInfo.cloneBlock.element );
                                  return;
                              }
                          }
                          //ワークスペースエリア
                          x0 = $(ws.workAreaElement).offset().left;
                          y0 = $(ws.workAreaElement).offset().top;
                          x1 = x0+$(ws.workAreaElement).outerWidth()*ws.scale();
                          y1 = y0+$(ws.workAreaElement).outerHeight()*ws.scale();
                          if(x0 < event.pageX && y0 < event.pageY&&
                             x1 > event.pageX && y1 > event.pageY)
                          {
                              self.dropWorkspace(ws,dragInfo.cloneBlock);
                              self.popFloatDraggingListByElem( dragInfo.cloneBlock.element );
                          }
                      });
                  }
                  //移動処理
                  self.moveStop(dragInfo.targetBlock);
                  if(dragInfo.cloneBlock)
                  {
                      if(!dragInfo.srcBlock.isCloneDragMode){
                          self.traverseUnderBlock(block,{
                              blockCb:function(block){
                                  block.setNoConnectMode(false);
                                  $(block.element).css({opacity:1.0});
                                  $(block.element).show();
                              },
                          });
                      }
                  }
                  dragInfo = null;
                  isFloatDragMode = false;
              },
          });
          //jqueryUIのドラッグのみタッチに限定対応させます
          //※幾つかライブラリ使ってみたけど環境依存する色々な挙動が挟まる事が多数あったので
          var checkIgnoreEmuTarget_ = function(e){
              if(["BUTTON",
                  "SELECT",
                  "OPTION"].indexOf($(e.target).prop("tagName"))>=0)
              {
                 return true;
              }
          };
          var myDraggable = blockElem;
          var widget = myDraggable.data('ui-draggable');
          var clickEvent = null;
          myDraggable.on({
          'touchstart':function(e){
              if ( checkIgnoreEmuTarget_(e) ){
                  return;
              }
              var event = e.originalEvent;
              var touches = event.changedTouches,
                  first = touches[0];
              var simulatedEvent = document.createEvent('MouseEvent');
              simulatedEvent.initMouseEvent("mousedown", true, true, window, 1, first.screenX, first.screenY, first.clientX, first.clientY, false, false, false, false, 0/*left*/, null);
              //widget._mouseStart(simulatedEvent);
              //widget._mouseDownEvent = simulatedEvent;
              simulatedEvent.fromTouch = true;
              first.target.dispatchEvent(simulatedEvent);
          },
          'touchmove':function(e){
              if ( checkIgnoreEmuTarget_(e) ){
                  return;
              }
              var event = e.originalEvent;
              var touches = event.changedTouches,
                  first = touches[0];
              var simulatedEvent = document.createEvent('MouseEvent');
              simulatedEvent.initMouseEvent("mousemove", true, true, window, 1, first.screenX, first.screenY, first.clientX, first.clientY, false, false, false, false, 0/*left*/, null);
              //widget._mouseDownEvent = clickEvent;
              //widget._mouseMove(simulatedEvent);
              simulatedEvent.fromTouch = true;
              first.target.dispatchEvent(simulatedEvent);
          },
          'touchend':function(e){
              if ( checkIgnoreEmuTarget_(e) ){
                  return;
              }
              var event = e.originalEvent;
              var touches = event.changedTouches,
                  first = touches[0];
              var simulatedEvent = document.createEvent('MouseEvent');
              simulatedEvent.initMouseEvent("mouseup", true, true, window, 1, first.screenX, first.screenY, first.clientX, first.clientY, false, false, false, false, 0/*left*/, null);
              //widget._mouseUp(simulatedEvent);
              //widget._mouseDownEvent = null;
              simulatedEvent.fromTouch = true;
              first.target.dispatchEvent(simulatedEvent);
          }});
    };
}




$(function(){
    // -- カスタムバインド --

    function getCharacterOffsetWithin(range, node) {
        var treeWalker = document.createTreeWalker(
            node,
            NodeFilter.SHOW_TEXT,
            function(node) {
                var nodeRange = document.createRange();
                nodeRange.selectNode(node);
                return nodeRange.compareBoundaryPoints(Range.END_TO_END, range) < 1 ?
                    NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
            },
            false
        );

        var charCount = 0;
        while (treeWalker.nextNode()) {
            charCount += treeWalker.currentNode.length;
        }
        if (range.startContainer.nodeType == 3) {
            charCount += range.startOffset;
        }
        return charCount;
    }
        
    ko.bindingHandlers.editableText = {
        init: function(element, valueAccessor) {
            $(element).addClass("editableContent");
            $(element).on('blur', function() {
                var observable = valueAccessor();
                observable( $(this).text() );
            });
            //TODO:ここらへんのキャレット復帰方法がちゃんとできれば
            //     リアルタイムに伸縮するテキストエリアが実現できる
            //$(element).on('input', function() {
            //var range = window.getSelection().getRangeAt(0);
            //var s = range.startOffset;
            //var e = range.endOffset;
            //var sc = range.startContainer;
            //})
            //var range2 = window.getSelection().getRangeAt(0);
            //range2.setStart(sc, s);
            //range2.setEnd(sc, e);
            //var sel = window.getSelection();
            //sel.removeAllRanges();
            //sel.addRange(range2);
            //});
        },
        update: function(element, valueAccessor) {
            var value = ko.utils.unwrapObservable(valueAccessor());
            $(element).text(value);
        }
    };

    //■ 実行環境を構築(ブロックのコールバックが使えるグローバル環境です) ■
    var makeExecContext = function()
    {
        var exeContext = {};
        // バージョン
        exeContext.contextVersion = "0.01";

        // 複数人接続用の自分の固有ID
        // (カメラ等で同じIDは6個までしか使えない＆切断処理しないとゴミが残る等、
        //  サンドボックス化されて無いひどい状態なので
        //  自身でサンドボックスを実現するためのID。)
        // TODO: 複数人対応時はキープアライブ等でIDの管理を実装する…（乱数だとゴミ掃除出来ないのでダメ。空きを再利用して必ず初期化して使えスタイルがいいかも)
        exeContext.sandBoxID = "SandBoxA";

        // グローバルな作業用データ(最後に○○系。加工前のデータが入ってる事が殆どです)

        // 最後に認識した単語データ
        exeContext.lastRecoData   = {rawData:null,};

        // 最後に調べた人データ
        exeContext.lastPeopleData   = {rawData:null,};

        // 最後に調べた移動物体データ
        exeContext.lastMovementData   = {rawData:null,};

        // 最後にキャプチャした写真データ
        exeContext.lastCaptureImageData = makeNullData_CaptureImage();//{pixels:null, w:0, h:0, camId:0, leftRad:0, topRad:0, rightRad:0, bottomRad:0,};


        // 汎用データテーブル
        exeContext.generalDataTable = {};


        // qiMessaging経由のインスタンス
        exeContext.setupExecContextFromQim = function(qims)
        {
            // 初期化とsubscribeが必要なモノの起動を行います

            // MEMO:
            // (まだ理解しきれてないけどsubscibeしておけばALEngagementZonesなど
            //  とりあえず色々動くみたいなのでやっておきます
            //  …名前付きでやる割にはグローバルに影響してるのが良く理解できてない部分
            //  …色んなものが再起動を超えてグローバルのようなので値の初期化もなるべく最初にやっておくことに
            //  (これだと多人数で遊ぶと毎回で初期化されかねないけど基本的に変えたい人は直前に変えるブロックを
            //   配置するべきという概念でやるべきっぽい匂いがする…寧ろ積極的に定期的に初期化するべきな予感…
            //   知らないだけでサンドボックスとかあるのだろうか？)
            //  (起動を超えて保存される感じからどこかに初期値一覧がありそう。ALMemoryの機能だろうか…全リセットコマンド作りたい)
            //  (しかしGPUのコマンド生で扱ってる感じでバグの温床っぽくてヤナ感じ。
            //   GPU周りみたいに差分とか全書き出しとかを管理するステートキャッシュみたいなの作るべきかな…)

            exeContext.qims      = qims;
            exeContext.alIns     = {};
            exeContext.cameraIns = null;
            exeContext.qims.service("ALAutonomousLife").done(function(ins){
              exeContext.alIns.alAutonomousLife = ins;
              exeContext.alIns.alAutonomousLife.getState().then(function(state){
                  if(state!="disable"){
                      return exeContext.alIns.alAutonomousLife.setState("disable");
                  }
              });
            });
            exeContext.qims.service("ALMemory").done(function(ins){
              exeContext.alIns.alMemory = ins;
            });
            exeContext.qims.service("ALTextToSpeech").done(function(ins){
              exeContext.alIns.alTextToSpeech = ins;
            });
            exeContext.qims.service("ALAudioDevice").done(function(ins){
              exeContext.alIns.alAudioDevice = ins;
            });
            exeContext.qims.service("ALMotion").done(function(ins){
              exeContext.alIns.alMotion = ins;
            });
            exeContext.qims.service("ALRobotPosture").done(function(ins){
              exeContext.alIns.alRobotPosture = ins;
            });
            exeContext.qims.service("ALVideoDevice").done(function(ins){
              exeContext.alIns.alVideoDevice = ins;
              exeContext.pepperCameraTopIns    = new PepperCamera(ins,{name:"pepper_block_top_cam"   +exeContext.sandBoxID,cam:0});
              exeContext.pepperCameraBottomIns = new PepperCamera(ins,{name:"pepper_block_bottom_cam"+exeContext.sandBoxID,cam:1});
              exeContext.pepperCameraDepthIns  = new PepperCamera(ins,{name:"pepper_block_depth_cam"+exeContext.sandBoxID,cam:2});
            });
            exeContext.qims.service('ALMemory').then(function(ins){
              exeContext.alIns.alMemory = ins;
            });
            exeContext.qims.service('ALPeoplePerception').then(function(ins){
              exeContext.alIns.alPeoplePerception = ins;
              exeContext.alIns.alPeoplePerception.subscribe("PepperBlock");
            });
            exeContext.qims.service('ALMovementDetection').then(function(ins){
              exeContext.alIns.alMovementDetection = ins;
              exeContext.alIns.alMovementDetection.subscribe("PepperBlock");
              //TEST
              exeContext.alIns.alMovementDetection.getColorSensitivity().done(function(v){console.log("getColorSensitivity "+v);});
              exeContext.alIns.alMovementDetection.getDepthSensitivity().done(function(v){console.log("getDepthSensitivity "+v);});
              exeContext.alIns.alMovementDetection.getCurrentPrecision().done(function(v){console.log("getCurrentPrecision "+v);});
              exeContext.alIns.alMovementDetection.getCurrentPeriod().done(function(v){console.log("getCurrentPeriod "+v);});
              
              //exeContext.alIns.alMovementDetection.setColorSensitivity(0.001);
              //exeContext.alIns.alMovementDetection.setDepthSensitivity(0.005);
              exeContext.alIns.alMovementDetection.setColorSensitivity(0.005);
              exeContext.alIns.alMovementDetection.setDepthSensitivity(0.008);
            });
            exeContext.qims.service('ALEngagementZones').then(function(ins){
              exeContext.alIns.alEngagementZones = ins;
              exeContext.alIns.alEngagementZones.subscribe("PepperBlock");

              exeContext.alIns.alEngagementZones.setFirstLimitDistance(3.0);
              exeContext.alIns.alEngagementZones.setSecondLimitDistance(5.5);
              exeContext.alIns.alEngagementZones.setLimitAngle(180);
            });
            exeContext.qims.service('ALVisualSpaceHistory').then(function(ins){
              exeContext.alIns.alVisualSpaceHistory = ins;
              exeContext.alIns.alVisualSpaceHistory.subscribe("PepperBlock");
            });

        };

        //■便利そうな補助関数など
        exeContext.onFail = function(e) {
            //dfd向けエラー関数
            console.error('fail:' + e);
        };
        exeContext.onFailPass = function(e) {
            //dfd向けエラー関数 スルー付
            //MEMO: 
            // チェイン時のおそらくお望みの動作は、
            //  処理A.then(処理B,fail).then(null,onFailPass)
            // かも。thenの仕様は処理Aの結果を分岐するので、処理Bのエラーをスルーする際自分は勘違いしたことあり。
            console.log('fail:' + e); 
            return $.Deferred().resolve();
        };
        exeContext.subscribeAlMemoryEvent = function(eventKey, eventCallback){
            //ALMemoryのイベントキーのコールバックを扱うための関数
            // eventKey      … メモリイベントキー
            // eventCallback … イベント時に呼ばれるコールバック。形式は、
            //   eventCallback(eventDfd, eventKeyValue)
            //   eventDfd … resolveにするとコールバック呼び出し終了
            //   eventKeyValue イベントキーの対する値。ない場合はnull

            // イベント用メモリキーよりイベント監視のためのインスタンスを取得します
            return exeContext.alIns.alMemory.subscriber(eventKey).then(function(subscriber){
                // イベント監視のコールバックを登録します
                var id = null;
                var eventDfd = $.Deferred();
                //@@console.log("subscribe event" + eventKey);
                subscriber.signal.connect(function(eventKeyValue){
                    // ここはALMemoryのイベントキーのハンドラです
                    //  ※deferredのハンドラではないので混乱注意。qimessagingのsingalというあたりで実装されているコールバック機構です
                    //@@console.log("update event" + eventKey + " " + eventKeyValue);
                    eventCallback(eventDfd, eventKeyValue);
                })
                .then(function(id_){
                    id = id_;
                },function(){
                    eventDfd.reject();
                });
                return eventDfd.promise().then(function(){
                    // イベント完了したのでイベントコールバックを解除します
                    console.log("unsubscribe event" + eventKey);
                    if(id){
                        subscriber.signal.disconnect(id);
                        id = null;
                    }
                });
            });
        };

        //■デバッグ用
        exeContext.debugCanvasList ={};
        exeContext.pixelPerMeter = 70;

        return exeContext;
    }

    // -- MVVMのモデル(このアプリの中枢です) --
    function MyModel() {
        var self = this;

        //■ ブロック管理を作成 ■
        var execContext = makeExecContext();
        self.blockManager = new BlockManager( execContext );

        //■ URLパラメータより ■
        if(getUrlParameter("lunchPepper")){
            self.lunchPepper = true;
        }
        else{
            self.lunchPepper = false;
        }
        if(getUrlParameter("loadJsonUrl")){
            // とりあえずな実装…
            var url = getUrlParameter("loadJsonUrl");
            $.ajax({
              type: 'GET',
              url: url,
              dataType: 'json',
              success: function(json){
                  setTimeout(function(){
                    self.fromJSON(json);
                    alert(url+"の読み込み完了です");
                  },2000);
              },
              error: function(XMLHttpRequest, textStatus, errorThrown){
                  alert(url+"の読み込みでエラーです:"+textStatus);
              },
            });
        }

        //■ ＵＩ関連の準備など ■

        self.wakeupPepper = function(){
          if(execContext.qims){
              execContext.qims.service("ALMotion")
              .then(function(alMotion){
                  return alMotion.wakeUp();
              });
          }
        };
        self.restPepper = function(){
          if(execContext.qims){
              execContext.qims.service("ALMotion")
              .then(function(alMotion){
                  return alMotion.rest();
              });
          }
        };
        
        // 起動ボタン
        self.execBlock = function(){
        };
        // 停止
        self.stopBlock = function(){
            
        };

        // セーブとロード
        self.toJSON = function(){
            var saveData = {
                version:"00.01",
                toyBoxWsLst:    [],
                factoryBoxWsLst:[],
            };
            $.each(self.toyBoxWsList(),function(k,wsObsv){
                saveData.toyBoxWsLst.push(wsObsv().toJSON());
            });
            $.each(self.factoryBoxWsList(),function(k,wsObsv){
                saveData.factoryBoxWsLst.push(wsObsv().toJSON());
            });
            return saveData;  
        };
        self.fromJSON = function(data){
            var saveData = data;
            self.toyBoxWsList.removeAll();
            $.each(saveData.toyBoxWsLst,function(k,wsJson){
                var wsIns = self.blockManager.createBlockWorkSpaceIns("droppableScope")
                self.toyBoxWsList.push(ko.observable(wsIns));
                wsIns.fromJSON(wsJson);
            });
            self.factoryBoxWsList.removeAll();
            $.each(saveData.factoryBoxWsLst,function(k,wsJson){
                var wsIns = self.blockManager.createBlockWorkSpaceIns("droppableScope")
                wsIns.fromJSON(wsJson);
                self.factoryBoxWsList.push(ko.observable(wsIns));
            });
        };
        self.saveBlock = function(){
            if(!localStorage)return;
            localStorage.setItem("working_saveData",JSON.stringify(self.toJSON()));
        };
        self.loadBlock = function(){
            if(!localStorage)return;
            var saveData = JSON.parse(localStorage.getItem("working_saveData"));
            self.fromJSON(saveData);
        };

        // 共有(仮)
        self.shareBlock = function(){
            var saveData = {
                version:"00.01",
                toyBoxWsLst:    [],
                factoryBoxWsLst:[],
            };
            $.each(self.toyBoxWsList(),function(k,wsObsv){
                saveData.toyBoxWsLst.push(wsObsv().toJSON());
            });
            $.each(self.factoryBoxWsList(),function(k,wsObsv){
                saveData.factoryBoxWsLst.push(wsObsv().toJSON());
            });
            $("#debugLogBox").text(
                JSON.stringify(saveData)
            );
        };

        // デバッグキャンバス(仮)
        self.debugCanvasList = ko.observableArray();
        self.debugCanvasList.push({id:0,btnW:"1em",layers:[{id:"0"},{id:"1"},{id:"2"},{id:"3"},{id:"4"},]});
        self.debugCanvasList.push({id:1,btnW:"1em",layers:[{id:"0"},{id:"1"},{id:"2"},{id:"3"},{id:"4"},]});
        self.debugCanvasList.push({id:2,btnW:"1em",layers:[{id:"0"},{id:"1"},{id:"2"},{id:"3"},{id:"4"},]});
        self.debugCanvasList.push({id:3,btnW:"1em",layers:[{id:"0"},{id:"1"},{id:"2"},{id:"3"},{id:"4"},]});
        self.debugCanvasList.push({id:4,btnW:"1em",layers:[{id:"0"},{id:"1"},{id:"2"},{id:"3"},{id:"4"},]});
        self.debugCanvasTabBtnClick = function(data,e){
            $(".debugCanvas").addClass("debugCanvasNoSel");
            if(typeof data.id !== 'undefined')
            {
                var debugCanvasElm = $($(".debugCanvas")[data.id]);
                $(debugCanvasElm).removeClass("debugCanvasNoSel");
                execContext.debugCanvasList ={};
                execContext.debugCanvasList[data.id] = {};
                $(".debugCanvasLayer",debugCanvasElm).each(function(k,v){
                    execContext.debugCanvasList[data.id][k] = v;
                });
            }else{
                execContext.debugCanvasList ={};
            }
        };
        $(".debugCanvas").addClass("debugCanvasNoSel");

        // ■ 接続処理 ■

        // IP入力部分
        self.ipXXX_000_000_000 = ko.observable(192);
        self.ip000_XXX_000_000 = ko.observable(168);
        self.ip000_000_XXX_000 = ko.observable(1);
        self.ip000_000_000_XXX = ko.observable(2);

        var pepper_ip;
        if(localStorage){
            pepper_ip = JSON.parse(localStorage.getItem("pepper_ip"));
        }
        if(pepper_ip){
            self.ipXXX_000_000_000( pepper_ip.ip[0] );
            self.ip000_XXX_000_000( pepper_ip.ip[1] );
            self.ip000_000_XXX_000( pepper_ip.ip[2] );
            self.ip000_000_000_XXX( pepper_ip.ip[3] );
        }
        else{
            pepper_ip = {
                ip:[self.ipXXX_000_000_000(),
                    self.ip000_XXX_000_000(),
                    self.ip000_000_XXX_000(),
                    self.ip000_000_000_XXX(),],
            };
            if(localStorage){
                localStorage.setItem("pepper_ip",JSON.stringify(pepper_ip));
            }
        }
        var updatePepperIp = function(){
            pepper_ip.ip[0] = self.ipXXX_000_000_000();
            pepper_ip.ip[1] = self.ip000_XXX_000_000();
            pepper_ip.ip[2] = self.ip000_000_XXX_000();
            pepper_ip.ip[3] = self.ip000_000_000_XXX();
            if(!localStorage)return;
            localStorage.setItem("pepper_ip",JSON.stringify(pepper_ip));
        }
        self.ipXXX_000_000_000.subscribe(updatePepperIp);
        self.ip000_XXX_000_000.subscribe(updatePepperIp);
        self.ip000_000_XXX_000.subscribe(updatePepperIp);
        self.ip000_000_000_XXX.subscribe(updatePepperIp);

        // ■ 接続部分
        self.nowState = ko.observable("未接続");
        self.connect = function() 
        {
            var pepper_ip = JSON.parse(localStorage.getItem("pepper_ip"));
            var ip = 
            pepper_ip.ip[0] + "." +
            pepper_ip.ip[1] + "." +
            pepper_ip.ip[2] + "." +
            pepper_ip.ip[3];
            var qims;
            if(execContext.qims){
                //TODO: 接続状態の確認と再接続の方法を考える
                if(self.nowState()=="切断")
                {
                    execContext.qims.socket().socket.connect();
                }
            }
            else{
                if(self.lunchPepper){
                     qims = new QiSession();
                }else{
                     qims = new QiSession(ip);
                }
                qims.socket()
                .on('connect', function (aa) {
                    self.nowState("接続中");
                    qims.service("ALTextToSpeech")
                    .done(function (tts) {
                        tts.say("せつぞく、ぺっぷ");
                    });
                    execContext.setupExecContextFromQim(qims);
                })
                .on('disconnect', function (aa) {
                  self.nowState("切断");
                });
            }
        };

        // ■ 作業場の構築をします ■
        self.materialBoxWsList = ko.observableArray();

        self.toyBoxWsList = ko.observableArray();
        self.toyBoxWsList.push(ko.observable(
            self.blockManager.createBlockWorkSpaceIns("droppableScope","箱１")
        ));
        self.toyBoxWsList.push(ko.observable(
            self.blockManager.createBlockWorkSpaceIns("droppableScope","箱２")
        ));
        self.toyBoxWsList.push(ko.observable(
            self.blockManager.createBlockWorkSpaceIns("droppableScope","箱３")
        ));
        self.toyBoxWsList.push(ko.observable(
            self.blockManager.createBlockWorkSpaceIns("droppableScope","箱４")
        ));

        self.factoryBoxWsList = ko.observableArray();

        self.factoryBoxWsList.push(ko.observable(
            self.blockManager.createBlockWorkSpaceIns("droppableScope","組み立て１")
        )); 
        self.factoryBoxWsList.push(ko.observable(
            self.blockManager.createBlockWorkSpaceIns("droppableScope","組み立て２")
        )); 
        self.factoryBoxWsList.push(ko.observable(
            self.blockManager.createBlockWorkSpaceIns("droppableScope","組み立て３")
        )); 

        // ■ブロック定義の登録とそざいBOXの追加のコールバックを実行します
        $.each(pepperBlock.blockDefCallbaks,function(k,callback){
            callback(self.blockManager, self.materialBoxWsList);
        });

        // 素材リストは配置の自動レイアウトを設定します
        $.each(self.materialBoxWsList(),function(k,ws){
            ws().setAutoArrayLayout();
        });
    }
    myModel = new MyModel();
    ko.applyBindings( myModel );
});
