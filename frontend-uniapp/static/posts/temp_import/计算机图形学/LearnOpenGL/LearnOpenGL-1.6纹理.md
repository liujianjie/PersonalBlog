# 纹理

- 简介

  - 若给每个顶点添加颜色来增加图形的细节，会增加开销，所以用纹理。

  - 纹理是一个2D图片，可以认为纹理附在物体表面上，其实是根据当前片段的uv值，采样纹理- 的颜色值作为当前片段的颜色。

- 纹理坐标

  ![](图片/1.6纹理/1.纹理uv.png)

  - 每个顶点就会关联着一个纹理坐标(Texture Coordinate)，用来标明该从纹理图像的哪个部分采样

    三角形有三个顶点，对应3个纹理坐标。

  - 使用纹理坐标获取纹理颜色叫做**采样**(Sampling)

  - 重点理解

    三角形只设置3个顶点的纹理坐标就行了，接下来它们会被传片段着色器中，它会为每个片段进行**纹理坐标的插值**。

    比如下面那条线(0,0)-(1.0)的各个像素点，会变插值成为**浮点小数**，从而形成小数点的纹理坐标

## 纹理环绕方式

纹理坐标的范围通常是从(0, 0)到(1, 1)，那如果我们把纹理坐标设置在范围之外

| 环绕方式           | 描述                                                         |
| :----------------- | :----------------------------------------------------------- |
| GL_REPEAT          | 对纹理的默认行为。重复纹理图像。                             |
| GL_MIRRORED_REPEAT | 和GL_REPEAT一样，但每次重复图片是镜像放置的。                |
| GL_CLAMP_TO_EDGE   | 纹理坐标会被约束在0到1之间，超出的部分会重复纹理坐标的边缘，产生一种边缘被拉伸的效果。 |
| GL_CLAMP_TO_BORDER | 超出的坐标为用户指定的边缘颜色。                             |

当纹理坐标超出默认范围时，每个选项都有不同的视觉效果输出

![](图片/1.6纹理/texture_wrapping.png)

前面提到的每个选项都可以使用glTexParameter*函数对单独的一个坐标轴设置（`s`、`t`（如果是使用3D纹理那么还有一个`r`）它们和`x`、`y`、`z`是等价的）：

```cpp
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_MIRRORED_REPEAT);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_MIRRORED_REPEAT);
```

```cpp
float borderColor[] = { 1.0f, 1.0f, 0.0f, 1.0f };
glTexParameterfv(GL_TEXTURE_2D, GL_TEXTURE_BORDER_COLOR, borderColor);
```

## 纹理过滤

- 简介

  纹理坐标不依赖于分辨率，它可以是任意浮点值，所以OpenGL需要知道怎样将**纹理像素**映射到纹理坐标。

  对应前面说的：下面那条线(0,0)-(1.0)的各个像素点，会变插值成为**浮点小数**，从而形成小数点的**纹理坐标**

- 过滤方式

  - GL_NEAREST：邻近过滤，OpenGL会选择中心点最接近纹理坐标的那个像素，左上角那个纹理像素的中心距离纹理坐标最近，所以它会被选择为样本颜色

    ![](图片/1.6纹理/filter_nearest.png)

  - GL_LINEAR：线性过滤，基于纹理坐标附近的纹理像素，计算出一个插值，近似出这些纹理像素之间的颜色。一个纹理像素的中心距离纹理坐标**越近**，那么这个纹理像素的颜色对最终的样本颜色的**贡献越大**

    ![](图片/1.6纹理/filter_linear.png)

- 对比效果

  ![](图片/1.6纹理/texture_filtering.png)

  - GL_NEARSET:颗粒感
  - GL_LINEAR：更平滑的图案

- 使用

  - 放大：线性过滤
  - 缩小：邻近过滤

  ```cpp
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
  ```

## 多级渐远纹理

- 问题引出

  当远处的物体和它的纹理有一样高的分辨率，由于在远处，物体所占的片段较小，OpenGL为这些片段在高分辨率纹理中获得正确的颜色变得困难。所以会不真实，且浪费内存

- 多级渐远纹理(Mipmap)简介

  它简单来说就是一系列的纹理图像，后一个纹理图像是前一个的二分之一

  ![](图片/1.6纹理/mipmaps.png)

- OpenGL提供函数创建Mipmap

  glGenerateMipmaps

- 过滤方式

  在渲染中切换多级渐远纹理级别(Level)时，OpenGL在**两个不同级别**的多级渐远纹理层之间会产生不真实的生硬边界

  | 过滤方式                  | 描述                                                         |
  | :------------------------ | :----------------------------------------------------------- |
  | GL_NEAREST_MIPMAP_NEAREST | 使用**最邻近**的多级渐远纹理来**匹配像素大小**，并使用**邻近插值**进行纹理采样 |
  | GL_LINEAR_MIPMAP_NEAREST  | 使用**最邻近**的多级渐远纹理级别，并使用**线性插值**进行采样 |
  | GL_NEAREST_MIPMAP_LINEAR  | 在两个最匹配像素大小的多级渐远纹理之间进行**线性插值**，使用**邻近插值**进行采样 |
  | GL_LINEAR_MIPMAP_LINEAR   | 在两个邻近的多级渐远纹理之间使用**线性插值**，并使用**线性插值**进行采样 |

  ```cpp
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR_MIPMAP_LINEAR);
  // 放大时，用GL_LINEAR
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
  ```

  **常见的错误是**:将放大过滤的选项设置为多级渐远纹理过滤选项之一,这样没有任何效果，因为多级渐远纹理主要是使用在**纹理被缩小**的情况下的：**纹理放大不会使用多级渐远纹理**。

# 加载与创建纹理

- 引出

  由于自己写，难，所以使用第三方库stb_image
  
- 下载地址

  https://github.com/nothings/stb/blob/master/stb_image.h

## stb_image.h

- 简介

  单头文件图像加载库

- 使用

  下载好std_image.h后，将它以`stb_image.h`的名字加入工程中

  新建**一个cpp**文件，并写入以下代码

  ```cpp
  #define STB_IMAGE_IMPLEMENTATION
  #include "stb_image.h"
  ```

  通过定义STB_IMAGE_IMPLEMENTATION，预处理器会修改头文件，让其只包含相关的函数定义源码，等于是将这个头文件变为一个 `.cpp` 文件了。

  这个新的cpp文件得放在项目下，不然会报错

  ![](图片/1.6纹理/10.bug1.png)

- 具体使用代码

  ```cpp
  int width, height, nrChannels;
  unsigned char *data = stbi_load("container.jpg", &width, &height, &nrChannels, 0);
  ```

- 细节

  用`stb_image.h`能够在图像加载时帮助我们翻转y轴

  ```cpp
  stbi_set_flip_vertically_on_load(true);
  ```

  因为OpenGL要求y轴`0.0`坐标是在图片的左下角的，但是图片的y轴`0.0`坐标通常在左上角。

## 生成纹理

- 使用代码

  和之前生成的OpenGL对象一样，纹理也是使用ID引用的

  ```cpp
  unsigned int texture;
  glGenTextures(1, &texture);
  ```

  绑定纹理

  ```cpp
  glBindTexture(GL_TEXTURE_2D, texture);
  ```

  使用前面stb_image.h载入的图片数据生成一个纹理

  ```cpp
  glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB, width, height, 0, GL_RGB, GL_UNSIGNED_BYTE, data);
  glGenerateMipmap(GL_TEXTURE_2D);
  ```

- 至此完整代码

  ```cpp
  unsigned int texture;
  glGenTextures(1, &texture);
  glBindTexture(GL_TEXTURE_2D, texture);
  // 为当前绑定的纹理对象设置环绕、过滤方式
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT);   
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
  // 加载并生成纹理
  int width, height, nrChannels;
  unsigned char *data = stbi_load("container.jpg", &width, &height, &nrChannels, 0);
  if (data)
  {
      glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB, width, height, 0, GL_RGB, GL_UNSIGNED_BYTE, data);
      glGenerateMipmap(GL_TEXTURE_2D);
  }
  else
  {
      std::cout << "Failed to load texture" << std::endl;
  }
  stbi_image_free(data);
  ```


# 应用纹理

## 给顶点数据添加纹理坐标

```cpp
float vertices[] = {
//     ---- 位置 ----       ---- 颜色 ----     - 纹理坐标 -
     0.5f,  0.5f, 0.0f,   1.0f, 0.0f, 0.0f,   1.0f, 1.0f,   // 右上
     0.5f, -0.5f, 0.0f,   0.0f, 1.0f, 0.0f,   1.0f, 0.0f,   // 右下
    -0.5f, -0.5f, 0.0f,   0.0f, 0.0f, 1.0f,   0.0f, 0.0f,   // 左下
    -0.5f,  0.5f, 0.0f,   1.0f, 1.0f, 0.0f,   0.0f, 1.0f    // 左上
};
```

![](图片/1.6纹理/vertex_attribute_pointer_interleaved_textures.png)

告诉OpenGL我们新的顶点格式

```cpp
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 8 * sizeof(float), (void*)0);
glEnableVertexAttribArray(0);

glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, 8 * sizeof(float), (void*)(3 * sizeof(float)));
glEnableVertexAttribArray(1);

glVertexAttribPointer(2, 2, GL_FLOAT, GL_FALSE, 8 * sizeof(float), (void*)(6 * sizeof(float)));
glEnableVertexAttribArray(2);
```

## 对应的glsl

```cpp
#version 330 core
layout (location = 0) in vec3 aPos;// 0 -12
layout (location = 1) in vec3 aColor;// 12-24
layout (location = 2) in vec2 aTexCoord;// 24-32

out vec3 ourColor;
out vec2 TexCoord;

void main()
{
    gl_Position = vec4(aPos, 1.0);
    ourColor = aColor;
    TexCoord = aTexCoord;
}
```

```cpp
#version 330 core
out vec4 FragColor;

in vec3 ourColor;
in vec2 TexCoord;

uniform sampler2D ourTexture;

void main()
{
    // 只有纹理
    FragColor = texture(ourTexture, TexCoord);
    // 纹理和颜色混合
    // FragColor = texture(texture1, TexCoord) * vec4(ourColor, 1.0);
}
```

- texture：来采样纹理的颜色

  第一个参数是纹理采样器，第二个参数是对应的**纹理坐标**

## 绑定纹理和绘画

在glDrawElements之前，绑定已加载的纹理到纹理单元0位置，片段着色器的采样器默认位置值为0

```cpp
glBindTexture(GL_TEXTURE_2D, texture);
glBindVertexArray(VAO);
glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);
```

## 效果

- 单纹理

  ![](图片/1.6纹理/2.0效果-单个纹理.png)

- 纹理和颜色混合

  ![](图片/1.6纹理/2.1效果-纹理和颜色混合.png)

# 纹理单元

- 引出

  **sampler2D**变量是uniform，上面却没用glUniform给它赋值。

- 原因

  上面只有一个纹理，它的默认纹理单元是0，它是默认的激活纹理单元，且glsl的采样器默认位置值为0，所以上面代码没有用glUniform

- 纹理单元

  - 可以用glUniform1i给纹理采样器分配一个**位置值**，这样能够在一个片段着色器中设置**多个纹理**。

  - 一个纹理的**位置值**通常称为一个**纹理单元**

- 前提

  激活对应的纹理单元

  ```cpp
  glActiveTexture(GL_TEXTURE0); // 在绑定纹理之前先激活纹理单元
  glBindTexture(GL_TEXTURE_2D, texture);
  ```

  GL_TEXTURE0总是被激活

- 片段着色器使用两个纹理采样器

  ```cpp
  #version 330 core
  ...
  
  uniform sampler2D texture1;
  uniform sampler2D texture2;
  
  void main()
  {
      FragColor = mix(texture(texture1, TexCoord), texture(texture2, TexCoord), 0.2);
  }
  ```

  - mix函数说明:
    - 根据第三个参数进行线性插值。
    - 如果第三个值是`0.0`，它会返回第一个输入；
    - 如果是`1.0`，会返回第二个输入值。
    - `0.2`会返回`80%`的第一个输入颜色和`20%`的第二个输入颜色，即返回两个纹理的混合色。

  绑定两个纹理到对应的纹理单元

  ```cpp
  glActiveTexture(GL_TEXTURE0);
  glBindTexture(GL_TEXTURE_2D, texture1);
  glActiveTexture(GL_TEXTURE1);
  glBindTexture(GL_TEXTURE_2D, texture2);
  
  glBindVertexArray(VAO);
  glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);
  ```
  
  glUniform1i设置OpenGL每个着色器采样器属于哪个**纹理单元**
  
  ```cpp
  ourShader.use(); // 不要忘记在设置uniform变量之前激活着色器程序！
  // 手动设置，采样器texture1的位置值是0
  glUniform1i(glGetUniformLocation(ourShader.ID, "texture1"), 0); 
  // 或者使用着色器类设置，采样器texture2的位置值是1
  ourShader.setInt("texture2", 1); 
  // 也是执行：glUniform1i(glGetUniformLocation(ourShader.ID, "texture2"), 1);
  
  while(...) 
  {
      [...]
  }
  ```
  
- 效果

  ![](图片/1.6纹理/2.2效果-两个纹理混合.png)
