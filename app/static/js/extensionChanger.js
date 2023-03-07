`use strict`;
// https://developer.mozilla.org/ja/docs/Web/API/DataTransferItem

// 遅延を起こす関数
const delay = (n) => new Promise(r => setTimeout(r, n * 1000));

// アップロードされたファイルを保存する関数
function saveImageFile(files) {

	let err = [];

	// 画像ファイル以外は除く処理
	[].forEach.call(files, file => {
		if (typeof file !== "undefined") {
			if (file.type.slice(0, 5) == "image") {
				// FileList要素を作成
				const dt = new DataTransfer();
				dt.items.add(file);
				// input要素を作成しファイルを保存する
				let saveFileElement = document.createElement("input");
				saveFileElement.type = "file";
				saveFileElement.files = dt.files;
				// ファイルを保存する先の要素を取得し、子要素に追加
				let uploadedFile = document.getElementById("uploaded-file");
				uploadedFile.appendChild(saveFileElement);
				// アップロードされたファイル情報を表示
				createFileInfoElement(file);
			} else {
				err.push("Not an image file: " + file.name);
			}
		}
	});
	return err;
}

// アップロードされたファイルの情報を表示する要素を作成する関数
function createFileInfoElement(file) {
	// アップロードしたファイル情報を表示するエリアを取得
	let fileInfo = document.getElementById("uploaded-file-info");
	// 新たに作成する要素を作成
	value = document.createElement("div");
	value.classList.add("form-group");
	value.classList.add("col-md-4");
	value.id = "file-name-info"
	value.textContent = file.name;
	fileInfo.appendChild(value);
}

// アップロードされたファイルの情報を削除する関数
function deleteFileInfoElement() {
	// アップロードしたファイル情報を表示するエリアを取得
	let fileInfo  = document.getElementById("uploaded-file-info");
	if (fileInfo.hasChildNodes()) {
		for (i = 0; i <= fileInfo.childElementCount; i++) {
			fileInfo.removeChild(fileInfo.firstElementChild);
		}
	}
}

// メッセージの x ボタンを作成する関数
function createHideButton() {
	return `
	<button type="button" class="close" data-dismiss="alert" aria-label="Close">
		<span aria-hidden="true">&times;</span>
	</button>
	`
}

// エラー表示要素を作成する関数
function createErrorMessage(errList) {
	let alertElement = document.getElementById("show-alert");
	[].forEach.call(errList, err => {
		// メッセージ表示要素を作成
		let alertMessage = document.createElement("div");
		for (let value of ["alert", "alert-danger", "alert-dismissible", "fade", "show"]) {
			alertMessage.classList.add(value);
		}
		alertMessage.role = "alert";

		// 非表示メッセージ内容を作成
		let hideButton = createHideButton();
		hideButton += err
		alertMessage.innerHTML = hideButton;
		// alertMessage.textContent = err;
		alertElement.appendChild(alertMessage);
	});
}

// 処理中のアニメーションを表示する関数
function showLoadingAnimation() {
	// 選択エリアの要素を削除
	let dropArea = document.getElementById("drop-area");
	dropArea.style.display = "none";

	// 処理中のアニメーションを表示
	let notDropArea = document.getElementById("not-drop-area");
	notDropArea.style.display = "block";
}

// 完了アイコンを表示する関数
function successAnimation() {
	// 処理中のアニメーションを非表示
	let loadingAnimation = document.getElementById("loader-icon");
	loadingAnimation.style.display = "none";

	// 完了アイコンを表示
	let successAnimation = document.getElementById("success-icon");
	successAnimation.style.display = "inline-block";
}

// エラーがアイコンを表示する関数
function errorAnimation(errList) {
	// 処理中のアニメーションを非表示
	let loadingAnimation = document.getElementById("loader-icon");
	loadingAnimation.style.display = "none";

	// エラーアイコンを表示
	let errorAnimation = document.getElementById("error-icon");
	errorAnimation.style.display = "inline-block"

	// エラーリストを使って自動で削除されない通知箇所を作成
	createErrorMessage(errList);
}

// 処理中のアニメーションを非表示にする関数
function hideAnimation(iconType) {
	// アイコンを表示
	let animation = document.getElementById(iconType);
	animation.style.display = "none";

	// 処理中のアニメーションを非表示
	let loadingAnimation = document.getElementById("loader-icon");
	loadingAnimation.style.display = "inline-block";

	// 処理中のアニメーションを削除
	let notDropArea = document.getElementById("not-drop-area");
	notDropArea.style.display = "none";

	// 処理中のアニメーションを表示
	let DropArea = document.getElementById("drop-area");
	DropArea.style.display = "block";
}

// 完了画面のアイコンを表示する関数
async function showSuccessAnimation(n) {
	// 完了アイコンを表示
	successAnimation();
	// n秒待機
	await delay(n);
	// アップロードボタンを再表示
	hideAnimation("success-icon");
	// 画像一覧リストとフォームデータを削除
	deleteFileInfoElement();
}

// エラーがある場合のアイコンを表示する関数
async function showErrorAnimation(n, errList) {
	// 完了アイコンを表示
	errorAnimation(errList);
	// n秒待機
	await delay(n);
	// アップロードボタンを再表示
	hideAnimation("error-icon");
	// 画像一覧リストとフォームデータを削除
	deleteFileInfoElement();
}

// 自動ダウンロードを行う関数
function automaticDownload(link, fileName) {
	// aタグを作り、それをクリックさせることでダウンロードする
	const linkElement = document.createElement("a");
	linkElement.download = fileName;
	linkElement.href     = link;
	document.body.appendChild(linkElement);
	linkElement.click();
	document.body.removeChild(linkElement);
}

// ファイル送信処理
function xhrPostRequest(XHR, FD) {

	// アップロードしたファイルと変換先の拡張子をフォームの設定
	let count = 0;
	let uploadedFile = document.getElementById("uploaded-file");
	let toExtension;
	for (let value of ["jpg", "jpeg", "png", "ico", "tiff"]) { 
		if (document.getElementById(value).checked) {
			toExtension = value;
		}
	}

	let err = [];
	while (uploadedFile.firstChild) {
		[].forEach.call(uploadedFile.firstChild.files, file => {
			if (typeof file !== "undefined") {
				if (file.type.slice(0, 5) == "image") {
					count += 1;
					FD.append("image-file-" + count.toString(), file);
				} else {
					err.push("Not an image file: " + file.name);
				}
			}
		});
		uploadedFile.removeChild(uploadedFile.firstChild);
	}

	// FormData オブジェクトにセット
	FD.append("to-extension", toExtension);
	FD.append("file-set-count", count);

	// フォームの中身を確認
	// for (let value of FD.entries()) { 
	// 	console.log(value); 
	// }

	// POST リクエストの URL を設定
	XHR.open("POST", "/api/extension-changer", true);
	// リクエスト処理
	XHR.send(FD);

	return XHR, err;
}

/**
 *  main function
 */
// ドラッグ&ドロップエリアの取得
let fileInput = document.getElementById("upload-file");
// 送信ボタンを取得
let sendFile  = document.getElementById("send-file-button");

// ドラッグオーバー時の処理
document.getElementById("drop-area").addEventListener("dragover", function(e) {
    e.preventDefault();
    document.getElementById("drop-area").classList.add("dragover");
}, false);

// ドラッグアウト時の処理
document.getElementById("drop-area").addEventListener("dragleave", function(e) {
    e.preventDefault();
    document.getElementById("drop-area").classList.remove("dragover");
}, false);

// ファイル内容が変更された時の処理
fileInput.addEventListener("change", function(e) {

	// 選択したファイルを取得
	const files = document.getElementById("upload-file").files;

	// ファイルを保存
	err = saveImageFile(files);
	// エラーがあれば、エラーメッセージを作成
	if (err.length != 0) {
		createErrorMessage(err);
	}

	// 送信ボタンが disable であれば、使えるようにする
	if (sendFile.disabled == true) {
		let uploadedFile = document.getElementById("uploaded-file");
		if (uploadedFile.hasChildNodes()) {
			sendFile.removeAttribute("disabled");
		}
	}
}, false);

// ドロップされた時の処理
document.getElementById("drop-area").addEventListener("drop", function(e) {
	e.preventDefault();
    document.getElementById("drop-area").classList.remove("dragover");
	// ドロップしたファイルを取得して保存
	// const files = document.getElementById("uploadFile").files;
	const files = e.dataTransfer.files;

	// ファイルを保存
	err = saveImageFile(files);
	// エラーがあれば、エラーメッセージを作成
	if (err.length != 0) {
		createErrorMessage(err);
	}
	
	// 送信ボタンが disable であれば、使えるようにする
	if (sendFile.disabled == true) {
		let uploadedFile = document.getElementById("uploaded-file");
		if (uploadedFile.hasChildNodes()) {
			sendFile.removeAttribute("disabled");
		}
	}
	e.dataTransfer.clearData();

}, false);

// 送信ボタンがクリックされた時の処理
sendFile.addEventListener("click", function(e){
	// 送信ボタンをクリックできないようにする
	sendFile.setAttribute("disabled", true);
	// 処理中のアイコンを表示
	showLoadingAnimation();

	// XHR の宣言
	let XHR = new XMLHttpRequest();
	let FD  = new FormData();

	// 非同期通信によるリクエスト処理
	XHR, err = xhrPostRequest(XHR, FD);

	// 操作が完了すれば、結果を表示する
	XHR.addEventListener("readystatechange", function(e) {
		if (XHR.readyState == 4) {
			let response;
			if (XHR.status == 200) {
				response = JSON.parse(XHR.responseText);
				if (response.isSuccess == true) {
					automaticDownload(response.fileInfo.path, response.fileInfo.fileName);
					if (response.err.count > 0) {
						showErrorAnimation(3, response.error.list);
					} else {
						showSuccessAnimation(3);
					}
				} else {
					// 予期せぬエラーの場合、しばらく経ってから再度試すようにメッセージを表示
					showErrorAnimation(3, ["Unknown error occur. Please retry later."]);
				}
			}
			// 非同期通信を解除する
			XHR.abort();
		}
	});
}, false);