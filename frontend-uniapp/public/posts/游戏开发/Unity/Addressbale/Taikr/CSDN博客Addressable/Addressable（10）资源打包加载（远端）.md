# 模拟远端发布资源

## 1.将本机模拟为一台资源服务器，通过Unity自带工具或者第三方工具

- 使用addresable的hosting

  ![image-20231121214149429](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202312110028052.png)

  记住使用的192.168.3.83与58474端口

- 设置addressable的profile

![image-20231121214410040](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202312110028628.png)

## 2.设置分组为远端加载路径

- 指定分组使用远端加载

  ![image-20231121214553225](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202312110028602.png)

- 记得需要勾选Build Remote Catalog

  ![image-20231121214834464](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202312110028607.png)

## 3.打包

![image-20231121214844063](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202312110028797.png)

有文件目录，也有bundle

## 4.测试

- 加载的AB包

  ![image-20231121215202679](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202312110028618.png)

- 代码

  ```c#
      void Start()
      {
          print("开始加载。。。");
          Addressables.LoadAssetsAsync<GameObject>(new List<string>() { "Cube", "SD" }, (obj) =>
          {
              var newObj = Instantiate(obj);
              newObj.transform.position = new Vector3(0, 0, 0);
          }, Addressables.MergeMode.Intersection);
      }
  ```

- 构建应用程序并且测试

  ![image-20231121215320810](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202312110028653.png)

  成功加载模拟服务器的AB包资源

# 实际上的远端发布资源

## 视频使用了Windows服务器+hfs.exe

我的服务器是linux，就跳过视频中的步骤

## 我使用的是Linux服务器+宝塔面板来操作

- 服务器信息

  使用的typecho搭建的网站，开放端口是80。（这步需要网上搜索）

  ![image-20231121223340187](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202312110028691.png)

- 远程服务器加载AB包过程

  1. Unity打包

     ![image-20231121222729779](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202312110028172.png)

  2. 上传打包的文件到服务器网站目录下

     ![image-20231121222953420](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202312110028644.png)

     可以用网页访问.json文件，查看是否能访问

     ![image-20231121223212051](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202312110028314.png)

  3. 再Unity中运行程序，即可从远程服务器中加载AB包

     ![image-20231121223408097](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202312110028926.png)


