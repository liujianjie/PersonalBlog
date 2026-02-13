此节太啰嗦和难理解，我直接给出我的理解

# Gamma校正

## Gamma简介

- 什么是gamma

- 怎么来的

  过去监视器是阴极射线管显示器（CRT）。

  这些监视器有个**公式**：设备输出亮度 = 输入电压的**2.2**次幂。

  这个2.2就叫gamma

## Gamma为2.2会造成什么问题

- 通过公式Gamma计算的输出亮度

  输出颜色时候值一般在0-1之间的浮点数。

  由上的公式，比如一个颜色分量0.5，输出颜色=0.5^2.2=0.2176<0.5

- 问题所在

  我们希望一个颜色分量为0.5，那么它最终输出的颜色也是0.5（线性输出），不需要进行什么gamma次幂，从而导致输出的颜色**变暗**（非线性输出）。

## Gamma“校正”

### 介绍

- 什么是Gamma<B>校正</B>

  解决上述问题就叫Gamma<B>校正</B>

- **如何校正**

  输出颜色x前，先对其进行：x^1/2.2运算，再输出颜色进行2.2次幂等于x本身，符合线性输出

- 代码与输出例子

  ```cpp
  // 模拟gamma校正
  float di = 0.5;
  float gammami = 2.2;
  float reversegammami = 1 / 2.2;
  float result = pow(di, reversegammami);
  cout << "pow(0.5, 1 / 2.2) = " << result << endl;
  
  result = pow(result, gammami);
  cout << "pow(pow(0.5, 1 / 2.2), 2.2) = " << result << endl; // 回归线性
  ```

  ![](图片/5.2Gamma校正/gamma校正图.png)

- 关于y=x、y=x^1/2.2、y=x^2.2的图

  ![](图片/5.2Gamma校正/gamma_correction_gamma_curves.png)

  注意x和y都在(0-1)之间

- 最终结果

  输出0.5颜色，不再输出非线性的0.2176颜色，而是0.5本身的颜色，于是乎当前处于线性输出环境。

### 在代码中如何实现

- 方式一

  开启GL_FRAMEBUFFER_SRGB简单的调用glEnable就行：

  ```cpp
  glEnable(GL_FRAMEBUFFER_SRGB);
  ```

- 方式二：在每个片段着色器运行的最后应用gamma校正

  ```cpp
  void main()
  {
      // do super fancy lighting 
      [...]
      // apply gamma correction
      float gamma = 2.2;
      fragColor.rgb = pow(fragColor.rgb, vec3(1.0/gamma));
  }
  ```

## 使用了gamma校正并采样纹理会有问题

- 问题描述

  1. 纹理制作者，制作好了纹理进行了gamma2.2次幂

     y=x^2.2，纹理的颜色是减少了。

  2. OpenGL加载纹理

     会自动进行一次gamma校正回归到线性y=x，纹理颜色增加

     这样我们在屏幕上输出纹理颜色的时候，进行gamma2.2次幂，纹理颜色减少，从而使纹理颜色回归，**处于线性下方**y = x^2.2，显示正确

  3. 但如果我们在输出到屏幕前手动进行gamma校正

     原本线性y=x变成y=x^1/2.2曲线，这曲线在线性y=x之上，纹理颜色增加。

     输出到屏幕时进行gamma2.2次幂，纹理颜色减少，变回线性y=x，处于y=x^2.2曲线函数上方，从而比原本颜色更亮

- 数值例子

  假设纹理颜色0.2176

  ```cpp
  float di = pow(0.5, 2.2);
  cout << "原本纹理的颜色：                                         " << di << endl;
  float gammami = 2.2;
  float reversegammami = 1 / 2.2;
  float result = pow(di, reversegammami);
  cout << "加载纹理自动进行一次gamma校正：pow(0.2176, 1/2.2)       =" << result << endl;
  result = pow(result, reversegammami);
  cout << "手动进行一次gamma校正：        pow(0.5,    1/2.2)       =" << result << endl;
  result = pow(result, gammami);
  cout << "输出到屏幕时进行一次gamma次幂：pow(pow(0.5,1/2.2), 2.2) =" << result << endl;
  ```

  ![](图片/5.2Gamma校正/模拟纹理gamma两次.png)

- 输出颜色前gamma校正一次发生颜色太亮解决方法

  - 方式一

    由于加载纹理自动校正一次，y = x

    在使用纹理颜色时手动进行gamma2.2次幂一次

    ```cpp
    float gamma = 2.2;
    vec3 diffuseColor = pow(texture(diffuse, texCoords).rgb, vec3(gamma));
    ```

    处于y=x^2.2

  - 方式二

    （我自己猜的，而文中则是说把颜色校正到线性空间中，很大概率是我错的）

    加载纹理格式为GL_SRGB或GL_SRGB_ALPHA，将不会对纹理自动校正一次

    处于y=x^2.2

  输出颜色前gamma校正，处于y=x

  输出颜色到屏幕上进行gamma2.2次幂，处于y=x^2.2

  


