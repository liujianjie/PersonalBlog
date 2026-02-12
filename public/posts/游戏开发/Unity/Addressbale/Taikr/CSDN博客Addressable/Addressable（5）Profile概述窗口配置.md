# Profile概述窗口配置

## 知识点一：概述配置用来干什么的

1. 在哪里保存构建的AB包
2. 运行时在哪里加载AB包

- 可以添加自定义变量，以便在打包加载时使用
- 我们之后在设置组 中打包和加载路径相关时，都是使用这里面的变量

## 知识点二：打开Profiles窗口

1. 第一种

   ![image-20231030205347510](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311220014733.png)

2. 第二种

   ![image-20231030205413094](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311220014996.png)

3. 第三种

   ![image-20231030205534248](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311220014687.png)

## 知识点三：Profiles窗口参数相关

- 开始界面

  ![image-20231030205635864](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311220014992.png)

  - 左边：具体配置

  - 右边：相关属性

    - Local

      本地打包和加载路径

    - Remote

      远程打包和加载路径

    - 目标平台

- Localbuildpath

  - 地址

    ![image-20231030205756382](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311220014002.png)

  - 具体位置

    ![image-20231030205846777](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311220014008.png)

- 一些操作

  ![image-20231030205927713](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311220015809.png)

  - Profile

    ![image-20231030205959878](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311220014040.png)

  - Variable

    ![image-20231030210012680](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311220015821.png)

  - Build and load path variables

    ![image-20231030210023909](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311220014080.png)

  这些都是右键删除

## 知识点四：Profiles变量语法

- 方括号

  可以使用它包裹**变量**，在打包构建时会计算方括号包围的内容

  ![image-20231030210328704](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311220015830.png)

  命名空间.类.变量

  ![image-20231030210603096](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311220014032.png)

- 大括号

  可以使用它包裹变量，在运行时会计算大括号包围的内容

  ![image-20231030210719047](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311220014193.png)

  暂时不知道他们（大括号与方括号）的区别

## 总结

Profiles窗口中配置的变量决定了我们之后 打包加载AB包时的路径
