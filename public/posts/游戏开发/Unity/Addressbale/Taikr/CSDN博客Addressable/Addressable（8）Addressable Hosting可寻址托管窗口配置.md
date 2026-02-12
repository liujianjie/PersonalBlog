# Addressable Hosting可寻址托管窗口配置

## 知识点一：文字介绍Addressables Hosting可寻址托管窗口

- 介绍一般情况

  一般资源服务器需要将其搭建为http服务器、这样才能进行资源的上传和下载

- Addressable Hosting作用

  - 而Unity为了简化本地测试的这一过程，提供了快捷搭建http服务器的工具

  - 通过它我们可以将我们的本机**模拟**为一台远端服务器来进行远端发布加载测试，可以帮助我们快速的进行远程打包下载的相关测试

- 简单理解作用

  简单理解就是把本机作为一台资源**服务器**

## 知识点二：打开可寻址托管窗口

- Addressables Groups窗口中 > Tools > Window > Hosting Services

  ![image-20231031130815645](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311230006470.png)

- Window > Asset Management > Addressables > Hosting 

  ![image-20231031130857136](/PersonalBlog/images/%e6%b8%b8%e6%88%8f%e5%bc%80%e5%8f%91/Unity/Addressbale/Taikr/CSDN%e5%8d%9a%e5%ae%a2Addressable/Addressable%ef%bc%888%ef%bc%89Addressable%20Hosting%e5%8f%af%e5%af%bb%e5%9d%80%e6%89%98%e7%ae%a1%e7%aa%97%e5%8f%a3%e9%85%8d%e7%bd%ae/image-20231031130857136.png)

## 知识点三：可寻址托管窗口参数

- 开启本机作为服务器

  ![image-20231123003036110](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311270006878.png)

- 使用本机服务器参数

  http://[PrivateIpAddress]:[HostingServicePort]已经默认填好

  - PrivateIpAddress是172.29.64.1
  - HostingServicePorts是58474

  ![image-20231123002305544](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311270007039.png)

  ![image-20231123002810760](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311270007462.png)

- 使用

  ![image-20231123002411916](/PersonalBlog/images/%e6%b8%b8%e6%88%8f%e5%bc%80%e5%8f%91/Unity/Addressbale/Taikr/CSDN%e5%8d%9a%e5%ae%a2Addressable/Addressable%ef%bc%888%ef%bc%89Addressable%20Hosting%e5%8f%af%e5%af%bb%e5%9d%80%e6%89%98%e7%ae%a1%e7%aa%97%e5%8f%a3%e9%85%8d%e7%bd%ae/image-20231123002411916.png)

  给分组选择Remote即可。

## 知识点四：注意事项

Addressable Hosting窗口创建的本地服务器有时候会失效，可以在资料区下载第三方工具 让本机变为一个http服务器 模拟远端加载

![image-20231031131442031](/PersonalBlog/images/%e6%b8%b8%e6%88%8f%e5%bc%80%e5%8f%91/Unity/Addressbale/Taikr/CSDN%e5%8d%9a%e5%ae%a2Addressable/Addressable%ef%bc%888%ef%bc%89Addressable%20Hosting%e5%8f%af%e5%af%bb%e5%9d%80%e6%89%98%e7%ae%a1%e7%aa%97%e5%8f%a3%e9%85%8d%e7%bd%ae/image-20231031131442031.png)

## 总结

如果我们要在本地模拟远端加载
1. 使用Addressable Hosting窗口 创建本地托管将本机模拟为远端服务器
2. 使用第三方的一些快捷搭建http服务器的工具 将本机作为http服务器 模拟为远端服务器
