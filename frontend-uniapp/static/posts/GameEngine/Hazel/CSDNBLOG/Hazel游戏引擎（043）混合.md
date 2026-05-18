> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  为了添加混合效果

- 如何实现

  OpenGL自带的函数即可

  ```cpp
  // 开启混合
  glEnable(GL_BLEND);
  // 混合函数
  glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
  ```

- 什么是混合

  两张图片有一部分叠加在一起，需要得出这重叠的部分最终的颜色。

- 如何混合

  根据两张图片的alpha通道，由**公式**推出来最终颜色。

  ![img](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307022112879.png)

  参考Blog：[LearnOpenGL-高级OpenGL-3.混合](https://blog.csdn.net/qq_34060370/article/details/129507006)


# 关键代码

```c++
// Texture中
......
GLenum internalFormat = 0, dataFormat = 0;
if (channels == 4) { // 区分有alpha通道的
    internalFormat = GL_RGBA8;
    dataFormat = GL_RGBA;
}
else if (channels == 3) {
    internalFormat = GL_RGB8;
    dataFormat = GL_RGB;
}
......
// OpenGLRendererAPI中
......
// 开启混合
glEnable(GL_BLEND);
// 混合函数
glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
......
```

# 例子演示与代码

## 错误例子1

- 代码

  sandboxapp.cpp

  ```cpp
  ......    
  // 只需绑定和上传一次，所以放在这里
  m_SquareTexture = Hazel::Texture2D::Create("asserts/textures/Checkerboard.png"); // Create返回的是shared_ptr，所以只需要赋值=
  m_SquareBlendTexture = Hazel::Texture2D::Create("asserts/textures/ChernoLogo.png"); // Create返回的是shared_ptr，所以只需要赋值=
  
  // 混合的带纹理的正方形
  m_SquareBlendTexture->Bind();
  glm::mat4 squareTexCoordBlendtransfrom = glm::translate(glm::mat4(1.0f), { 0.25f, -0.25f, 0.0f });
  Hazel::Renderer::Submit(m_SquareTexCoordShader, m_SquareTexCoordVertexArray, squareTexCoordBlendtransfrom);
  ......
  // 混合需要用的纹理
  Hazel::Ref<Hazel::Texture2D> m_SquareBlendTexture;		// 纹理
  ......
  ```

- 错误效果图

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307022053954.png)

- 错误原因

  新读取的图片是RGBA,**4**个通道的图片，而原先的代码只读取RGB**三**个通道，与图片实际通道**不符合**，所以会读取颜色出错。。

- 需要修改代码：**根据channel不同设置不同格式**

  OpenGLTexture.cpp

  ```cpp
  ......
  OpenGLTexture2D::OpenGLTexture2D(const std::string& path):
  m_Path(path)
  {
      int width, height, channels;
      stbi_set_flip_vertically_on_load(1);// 设置垂直翻转，由于OpenGL是从上往下的，所以要设置
      /*
      路径，加载完返回大小，通道rgb、rbga，返回的字符串指针指向的就是读取的纹理图片数据！
      */
      stbi_uc* data = stbi_load(path.c_str(), &width, &height, &channels, 0);
      HZ_CORE_ASSERT(data, "Failed to load image");
      m_Width = width;
      m_Height = height;
  	// 这里解决BUG的代码-----------------------------------------------------
      GLenum internalFormat = 0, dataFormat = 0;
      if (channels == 4) {
      internalFormat = GL_RGBA8;
      dataFormat = GL_RGBA;
      }
      else if (channels == 3) {
      internalFormat = GL_RGB8;
      dataFormat = GL_RGB;
      }
      HZ_CORE_ASSERT(internalFormat & dataFormat, "图片格式不支持");
      /*是纹理、要1个、生成纹理缓冲区返回id给变量*/ // 是GL_TEXTURE_2D，写错过GL_TEXTURE
      glCreateTextures(GL_TEXTURE_2D, 1, &m_RendererID);
      /*告诉OpenGLm_RendererID的纹理存储的是rbg8位，宽高的缓冲区*/
      glTextureStorage2D(m_RendererID, 1, internalFormat, m_Width, m_Height);
      /*告诉opengl，纹理缩小时用线性过滤*/
      glTextureParameteri(m_RendererID, GL_TEXTURE_MIN_FILTER, GL_LINE);
      /*告诉opengl，纹理放大时用周围颜色的平均值过滤*/
      glTextureParameteri(m_RendererID, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
      /*指定截取子区域，将纹理图片数据给上传OpenGL。m_RendererID后一个参数是级别。。。啥东西？*/
      glTextureSubImage2D(m_RendererID, 0, 0, 0, m_Width, m_Height, dataFormat, GL_UNSIGNED_BYTE, data);
      /*设置完OpenGL后可以释放，生成的字符串*/
      stbi_image_free(data);
  }
  ......
  ```

## 错误例子2

- 错误效果

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307022053955.png)

- 原因

  Cherno没说清楚，我也不太清楚。。。反正图像形状大致是C，但是似乎橙色和橘色像素点扩大了范围

- 修改代码：开启混合以及混合函数

  需要在Renderer体系类中增加一个Init函数，在应用开始时就**初始化**（调用这个函数）。

  ```cpp
  ......
  void OpenGLRendererAPI::Init()
  {
      // 开启混合
      glEnable(GL_BLEND);
      // 混合函数//////////////////////////
      glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
  }
  ......
  Application::Application()
  {
  	......
      // 初始化渲染
      Renderer::Init();
  }
  ......
  ```

- 自己测试

  若不渲染棋盘，开启了混合，但是**没有混合函数**，照样模糊

  说明上面问题是**没有开启混合函数**引起的。。。

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307022053057.png)

## 修复好后的正确结果

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307022053699.png)