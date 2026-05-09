# 寻址资源设置

## 知识点一：让资源变为可寻址资源

- 方法一操作

  选中资源，勾选Inspector窗口中的Addressable

  ![image-20231017211116402](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311200015397.png)

- 方法二操作

  选中资源，拖入Addressables Group窗口中

  ![image-20231017211230051](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311200015404.png)

- 结果

  ![image-20231017211248918](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311200015849.png)

- 注意

  1. C#代码无法作为可寻址资源
  2. Resources文件夹下的资源变为寻址资源，会移入到resources_moved文件夹中

## 知识点二：资源组窗口讲解

### 右键选择资源时菜单内容

- 图片

  ![image-20231017211457451](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311200015160.png)

- 小解

  1. 移到已有的分组
  2. 移到新分组
  3. 删除
  4. 简化寻址名称
  5. 拷贝资源名称
  6. 改变地址
  7. 创建新分组

### 资源信息

![image-20231017211716971](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311200015840.png)

1. 分组名\寻址名
2. 路径（不可重复，用来资源定位）
3. Labels：标签（可重复）

### 创建分组相关

- 创建位置

  ![image-20231017212033434](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311200016759.png)

- 两种分组

  - 1.Packed Assets：根据模板创建

    ![image-20231017212126612](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311200016906.png)

  - 2.Blank ：创建空分组

    ![image-20231017212202748](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311200015325.png)

  

### 配置概述相关

- 简介

  管理配置文件，可以配置打包目标、本地远程的打包加载路径等等信息

- 图片

  ![image-20231017212408445](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311200016448.png)

### Tools工具相关

- 简介

  ![image-20231017212747565](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311200015628.png)

- 图片

  ![image-20231017212734718](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311200016624.png)

### 重点：播放模式下如何访问寻址资源

- 位置

  ![image-20231017212841523](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311200015719.png)

- 视频说明

  ![image-20231017212853853](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311200015380.png)

- 简要说明

  - Use Asset Database

    直接使用文件夹中的资源

  - Simulate Groups

    模拟远程资产 绑定的下载速度和本地绑定的文件加载速度

  - Use Existing build

    从已经打好的Bundle中读取资源

### 构建打包相关

- 图片

  ![image-20231017213404817](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311200015663.png)

- 说明

  1. New Build：打包分组构建AB
  2. Update a Previous Build ： 更新上一次的打包
  3. Clean Build ： 清理构建

## 知识点三：资源名注意事项

  ![image-20231017213511853](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311200015686.png)

## 知识点四：资源分组

- 简介

  根据实际情况分组

- 分组类型

  1. 按照类型分组

     同一种资源一个组：比如图片放一组、音效放一组

  2. 按照使用分组

     一个关卡使用的资源一个组

  3. 逻辑实体一个组

     - 一个Ui界面、所有UI界面一个包
     - 一个角色或所有角色一个包
     - 所共享的资源一个包
