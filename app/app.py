import os
import uuid
import shutil
import werkzeug
from dotenv import load_dotenv

from flask import Flask, render_template, request

from .classes.ExtensionChanger import ClassExtensionChanger

# .envファイルの内容を読み込む
load_dotenv()
# 環境変数を取得
static_file_dir    = os.environ["STATIC_FILE_DIR"]
max_context_length = os.environ["MAX_CONTENT_LENGTH"]
image_files_dir    = os.environ["IMAGE_FILES_DIR"]
allowed_extensions = ["png", "jpg", "jpeg", "ico", "tiff"]

# 画像の保存先ファイルが存在しない場合は自動的に作成する
os.makedirs(image_files_dir, exist_ok=True)

# extension changer のクラスインスタンス
class_extension_changer = ClassExtensionChanger(
    static_file_dir=static_file_dir, allowed_extensions=allowed_extensions,
)

#Flaskオブジェクトの生成
app = Flask(__name__)

# 最大容量を指定 (5MB)
app.config["MAX_CONTENT_LENGTH"] = int(max_context_length) * 1024 * 1024

# index
@app.route("/", methods=["GET"])

def index():
    return render_template("extension_changer.html", request_type="get")

# 容量が大きい場合は例外処理を行う
@app.errorhandler(werkzeug.exceptions.RequestEntityTooLarge)
def handle_over_max_file_size(error):
    print("werkzeug.exceptions.RequestEntityTooLarge")
    message = "Error. File is too large. Please keep it under 5 MB."
    return render_template("get_images_from_pdf.html", request_type="get", message=message)

# API extension-changer
@app.route("/api/extension-changer", methods=["GET", "POST"])

def api_extension_changer():
    
    if request.method == "POST":
        
        return class_extension_changer(
            request=request
        )

    return render_template("404.html")

# 404 Not Found
@app.errorhandler(404)

def error_404(error):
    return render_template("404.html")

if __name__ == "__main__":
    app.run()