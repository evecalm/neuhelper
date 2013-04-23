// time stamp
var urls = {
		'kaoqin': { // 打卡
			'login_url': 'http://kq.neusoft.com/index.jsp',
			'post_url': 'http://kq.neusoft.com/login_wkq1103_3023.jsp',
			'attendance_url': 'http://kq.neusoft.com/record.jsp',
			'main_url': 'http://kq.neusoft.com/attendance.jsp'
		},
		'ehr': { // ehr
			'login_url': 'http://ehr.neusoft.com/loginindex.do',
			'post_url': 'http://ehr.neusoft.com/login.do?state=login',
			'main_url': 'http://ehr.neusoft.com/portal/portal.do?state=showPage&templateId=1'
		},
		'portal': { // 外网入口
			'login_url': 'https://portal.neusoft.com/dana-na/auth/url_default/welcome.cgi',
			'post_url': 'https://portal.neusoft.com/login.cgi',
			'main_url': 'https://portal.neusoft.com/dana/home/index.cgi'
		},
		'prcbs': { //日报
			'login_url': 'http://processbase.neusoft.com/',
			'post_url': 'http://processbase.neusoft.com/UserLogin.do',
			'main_url': 'http://processbase.neusoft.com/UserLogin.do'
		},
		'mail': { //Mail
			'login_url': 'https://mail.neusoft.com/owa/auth/logon.aspx?replaceCurrent=1&url=https%3a%2f%2fmail.neusoft.com%2fowa%2f',
			'post_url': 'https://mail.neusoft.com/owa/auth.owa',
			'main_url': 'https://mail.neusoft.com/owa/'
		}
	},
	db = null, //db handle
	_salt = 'saling', /// define a salt as the string encrypt key
	CHCKIN = 1,
	CHCKOUT = 2;

(function (window) { // init db handle
	db = openDatabase('Neuhelper','1.0','Neuhelper\'s datebase',2 * 1024 * 1024);
	db.transaction(function  (tx) {
		var d = new Date();
		tx.executeSql('CREATE TABLE IF NOT EXISTS klog (id unique,log,time,type)');
	});
})(window);


function localdata_attr (item,key,data) {
	if (typeof(item) === 'undefined') return null;
	var ret = localStorage.getItem(item);
	if (ret) {
		ret = decrypt_str(ret);
		ret = decodeURIComponent(ret);
		ret = JSON.parse(ret);
		if (typeof(key) !== 'undefined') {
			if (typeof(data) !== 'undefined') {
				ret = ret || {};
				ret[key] = data;
				ret = encodeURIComponent(JSON.stringify(ret));
				ret = encrypt_str(ret);
				localStorage.setItem(item,ret);
				return data;
			} else {
				return ret[key];
			}
		} else {
			return ret;
		}
	} else {
		if ('undefined' !== typeof(key) && typeof(data) !== 'undefined') {
			ret = {};
			ret[key] = data;
			ret = encodeURIComponent(JSON.stringify(ret));
			ret = encrypt_str(ret);
			localStorage.setItem(item,ret);
		}
		return ret;
	}
}

function localdata_remove (item,key) {
	var ret = localStorage.getItem(item);
	if (ret !== null) {
		if (typeof(key) !== 'undefined') {
			ret = decrypt_str(ret);
			ret = decodeURIComponent(ret);
			ret = JSON.parse(ret);
			delete ret[key];
			ret = encodeURIComponent(JSON.stringify(ret));
			ret = encrypt_str(ret);
			localStorage.setItem(item,ret);
		} else{
			localStorage.removeItem(item);
		}
	}
}

/// encrypt a string 
function encrypt_str(str) {
	var prand = "",
			i;
	for(i=0; i<_salt.length; i++) {
		prand += _salt.charCodeAt(i).toString();
	}
	var sPos = Math.floor(prand.length / 5);
	var mult = parseInt(prand.charAt(sPos) + prand.charAt(sPos*2) + prand.charAt(sPos*3) + prand.charAt(sPos*4) + prand.charAt(sPos*5),10);
	var incr = Math.ceil(_salt.length / 2);
	var modu = Math.pow(2, 31) - 1;
	var salt = Math.round(Math.random() * 1000000000) % 100000000;
	prand += salt;
	while(prand.length > 10) {
		prand = (parseInt(prand.substring(0, 10),10) + parseInt(prand.substring(10, prand.length),10)).toString();
	}
	prand = (mult * prand + incr) % modu;
	var enc_chr = "";
	var enc_str = "";
	for(i=0; i<str.length; i++) {
		enc_chr = parseInt(str.charCodeAt(i) ^ Math.floor((prand / modu) * 255),10);
		if(enc_chr < 16) {
			enc_str += "0" + enc_chr.toString(16);
		} else enc_str += enc_chr.toString(16);
		prand = (mult * prand + incr) % modu;
	}
	salt = salt.toString(16);
	while(salt.length < 8)salt = "0" + salt;
	enc_str += salt;
	return enc_str;
}

/// decrypt a string
function decrypt_str(str) {
	var prand = "",
			i;
	for(i=0; i<_salt.length; i++) {
		prand += _salt.charCodeAt(i).toString();
	}
	var sPos = Math.floor(prand.length / 5);
	var mult = parseInt(prand.charAt(sPos) + prand.charAt(sPos*2) + prand.charAt(sPos*3) + prand.charAt(sPos*4) + prand.charAt(sPos*5),10);
	var incr = Math.round(_salt.length / 2);
	var modu = Math.pow(2, 31) - 1;
	var salt = parseInt(str.substring(str.length - 8, str.length), 16);
	str = str.substring(0, str.length - 8);
	prand += salt;
	while(prand.length > 10) {
		prand = (parseInt(prand.substring(0, 10),10) + parseInt(prand.substring(10, prand.length),10)).toString();
	}
	prand = (mult * prand + incr) % modu;
	var enc_chr = "";
	var enc_str = "";
	for(i=0; i<str.length; i+=2) {
		enc_chr = parseInt(parseInt(str.substring(i, i+2), 16) ^ Math.floor((prand / modu) * 255),10);
		enc_str += String.fromCharCode(enc_chr);
		prand = (mult * prand + incr) % modu;
	}
	return enc_str;
}

//notification
function push_notification (data) {
	data = data || {};
	data.title = data.title || '通知';
	data.body = data.body || '这是一个假通知，您可以忽略';
	var hashdata = encodeURIComponent(JSON.stringify(data)),
		notification = webkitNotifications.createNotification(
			'/img/icon48.png',  // icon url - can be relative
			data.title,  // notification title
			data.body  // notification body text
		),
		time;
	notification.show();
	time = data.time;
	if ('undefined' === typeof(time)) {
		time = 4000;
	}
	if (false !== time) {
		time = time | 0;
		if (time) {
				time = 4000;
		}
		setTimeout(function  () {
			notification.cancel();
		},time);
	}
}

function loginKaoqin (config) { //config: {callback:parse}
	// chrome.cookies.remove({url:urls.kaoqin.login_url,name:'JSESSIONID'}); //remove the old session
	$.ajax({
		url: urls.kaoqin.login_url,
		type: 'GET',
		success: function  (htmlstr) {
			config.htmlstr = htmlstr;
			__loginKaoqin(config);
		},
		error: function  (XMLHttpRequest, textStatus, errorThrown) {
			alert(textStatus);
		}
	});
}

function __loginKaoqin (config) {
	var start = config.htmlstr.indexOf('KEY') + 3,
		end = config.htmlstr.indexOf('"',start),
		tiket =  config.htmlstr.substring(start,end),
		cookie;
		login_data = {
			"login":"true",
			"neusoft_attendance_online":""
		},
		start = config.htmlstr.indexOf('textfield') + 12,
		start = config.htmlstr.indexOf('"',start) + 3,
		end = config.htmlstr.indexOf('"',start),
		cookie = config.htmlstr.substring(start,end),
		tmp = "KEY" + tiket,
		usrinfo = localdata_attr('account','default');
	login_data[tmp] = "";
	login_data["neusoft_key"] = "ID" + tiket + "PWD" + tiket;
	tmp = 'ID' + cookie;
	login_data[tmp] = usrinfo.username;
	tmp = 'KEY' + cookie;
	login_data[tmp] = usrinfo.password;
	login_data = $.param(login_data);
	login_data = login_data.replace(/\!/g,'%21');
	$.ajax({
		url: urls.kaoqin.post_url,
		dataType:'html',
		method: "POST",
		data: login_data,
		success: function  (html) {
			config.htmlstr = html;
			console.log(config);
			config.callback(config);
		}
	});
}

function formatDate (date) {
	if (date instanceof Date) {
		var days = ['周日','周一','周二','周三','周四','周五','周六'];
		return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' +
			date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + ' ' + days[date.getDay()];
	} else{
		return '';
	}
}

function logmsg (data) { //write log to database
	if (db && data && data.log) {
		var d = new Date();
		data.type = data.type || 'info';
		db.transaction(function  (tx) {
			tx.executeSql('INSERT INTO klog (id,log,time,type) VALUES (?,?,?,?)',[+d,data.log,formatDate(d),data.type]);
		});
	}
}