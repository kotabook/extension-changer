import os
import uuid
import shutil
from PIL import Image

class ClassExtensionChanger():
    
    # init 関数
    def __init__(self, static_file_dir, allowed_extensions):
        self.static_file_dir = static_file_dir
        self.allowed_extensions = allowed_extensions
    
    # 許可した拡張子のみを許す関数
    def allowed_file(self, filename):
        return "." in filename and filename.rsplit(".", 1)[1].lower() in self.allowed_extensions
        
    # 画像ファイルかどうかを判定する関数
    def is_image_file(self, request, num):
        # ファイルがフォームにあるかどうか
        err = ""
        if f"image-file-{num}" in request.files:
            # ファイル名が空でないか
            if not request.files[f"image-file-{num}"].filename == "":
                # 画像の拡張子のファイルか
                if request.files[f"image-file-{num}"] and self.allowed_file(request.files[f"image-file-{num}"].filename):
                    return True, ""
                else:
                    err = f"Not Image File Found. {request.files[f'image-file-{num}'].filename}"
            else:
                err = f"Image File Name Not Found. {request.files[f'image-file-{num}'].filename}"
        else:
            err = f"Upload File Not Found."
        return False, err
    
    # 保存先のディレクトリパスとディレクトリを作成する関数
    def create_save_dir(self):
        user_uuid = uuid.uuid4()
        images_dir = f"{self.static_file_dir}/images/app/{user_uuid}"
        images_upload_dir, images_download_dir = f"{images_dir}/upload", f"{images_dir}/download"
        os.makedirs(images_upload_dir, exist_ok=True);os.makedirs(images_download_dir, exist_ok=True)
        return images_dir, images_upload_dir, images_download_dir

    # 送信されたファイルを取得
    def get_request_file(self, request, num, to_extension):
        image_file = request.files[f"image-file-{num}"]
        image_upload_name   = image_file.filename
        image_download_name = f"{image_upload_name.split('.')[0]}.{to_extension}"
        return image_file, image_upload_name, image_download_name

    # 同じ名前の画像がある場合は、名前を変更する関数を作成
    def refrain_duplicate(self, images_upload_dir, image_upload_name, image_download_name):
        image_save_path = f"{images_upload_dir}/{image_upload_name}"
        # もしすでにファイルがある場合は、画像名の後に番号を振る
        if os.path.isfile(image_save_path):
            num = 1
            image_upload_name = f"{image_upload_name.split('.')[0]}-{num}.{image_upload_name.split('.')[-1]}"
            image_download_name = f"{image_download_name.split('.')[0]}-{num}.{image_download_name.split('.')[-1]}"
            while True:
                image_save_path = f"{images_upload_dir}/{image_upload_name}"
                if not os.path.isfile(image_save_path):
                    break
                num += 1
                # ハイフンを取り除いて、新しい番号を付与する
                # 最後の番号の部分だけ取り除く方法を調べる
                image_upload_name = f"{image_upload_name.split('.')[0][:(len(str(num)) + 1) * -1]}-{num}.{image_upload_name.split('.')[-1]}"
                image_download_name = f"{image_download_name.split('.')[0][:(len(str(num)) + 1) * -1]}-{num}.{image_download_name.split('.')[-1]}"
                
        return image_upload_name, image_download_name
    
    # ファイルの拡張子を変更して保存
    def change_extension(
        self, image_file, images_upload_dir, image_upload_name,
        images_download_dir, image_download_name
    ):
        # 画像名が重複している場合は番号をつけて画像名を変更
        image_upload_name, image_download_name = self.refrain_duplicate(
            images_upload_dir=images_upload_dir, image_upload_name=image_upload_name, image_download_name=image_download_name
        )
        # フォームのファイルを保存
        image_file.save(f"{images_upload_dir}/{image_upload_name}")
        # PILモジュールを用いてファイルを取得する
        image_pil = Image.open(f"{images_upload_dir}/{image_upload_name}")
        # 拡張子を変換し保存
        image_pil.save(f"{images_download_dir}/{image_download_name}")
    
    # レスポンスの情報を追加する関数
    def create_response_info(
        self, is_success, err_list=[],
        images_download_dir=None, image_download_name=None
    ):
        response_json = dict(isSuccess=False, fileInfo=dict(), err=dict())
        
        if is_success:
            response_json["isSuccess"] = True
            response_json["fileInfo"]  = dict(
                path=f"{images_download_dir[len('./app'):]}/{image_download_name}",
                fileName=image_download_name
            )
        if len(err_list) > 0:
            response_json["err"] = dict(
                count=len(err_list),
                list=err_list
            )

        return response_json
        
    # call 関数
    def __call__(self, request):
        
        # レスポンスJSONを定義
        response_json = self.create_response_info(
            is_success=False, err_list=["Unknown error occur. Please retry later."]
        )

        # フォーマットに関するエラーがある場合
        try:
            # フォームにあるファイルの数を取得
            file_set_count = int(request.form["file-set-count"])
            to_extension   = request.form["to-extension"]
            
            # user_uuid を生成し、ディレクトリを作成
            images_dir, images_upload_dir, images_download_dir = self.create_save_dir()
            
            # ファイル数によって条件分岐 (0であればFalseを返す)
            if file_set_count > 0:
                effective_file_count, err_list = 0, []
                # 送信されたファイルを取得
                for num in range(1, file_set_count + 1):
                    # ファイルが画像であるかどうかを判定
                    check_result, err = self.is_image_file(request=request, num=num)
                    if check_result == True:
                        effective_file_count += 1
                        # リクエスト情報を取得
                        image_file, image_upload_name, image_download_name = self.get_request_file(
                            request=request, num=num, to_extension=to_extension
                        )
                        # 拡張子を変更
                        self.change_extension(
                            image_file=image_file, images_upload_dir=images_upload_dir, image_upload_name=image_upload_name,
                            images_download_dir=images_download_dir, image_download_name=image_download_name
                        )
                    else:
                        err_list.append(err)

                if effective_file_count == 1:
                    # レスポンスに情報をまとめる
                    response_json = self.create_response_info(
                        is_success=True, images_download_dir=images_download_dir,
                        image_download_name=image_download_name, err_list=err_list
                    )
                # ファイルが2つ以上ある場合
                elif effective_file_count > 1:
                    # アップロードされた画像をzip形式に圧縮
                    shutil.make_archive(f"{images_download_dir}", format="zip", root_dir=images_download_dir)
                    
                    # レスポンスに情報をまとめる
                    response_json = self.create_response_info(
                        is_success=True, images_download_dir=images_download_dir[:-1 * len("/download")],
                        image_download_name="download.zip", err_list=err_list
                    )
                else:
                    response_json = self.create_response_info(
                        is_success=False, err_list=err_list
                    )                

        except Exception as e:
            print(e)
            pass

        return response_json