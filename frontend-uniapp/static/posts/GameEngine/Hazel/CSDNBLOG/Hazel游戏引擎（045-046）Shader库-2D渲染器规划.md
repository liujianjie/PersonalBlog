> 文中若有代码、术语等错误，欢迎指正

[toc]

# 045 Shader库

## 解决044节的Bug

### vector的错误

- 初始化vector时候

  ```cpp
  void OpenGLShader::Compile(const std::unordered_map<GLenum, std::string>& shaderSources){
      GLuint program = glCreateProgram();
      std::vector<GLenum> glShaderIDs(shaderSources.size());// vector初始化
      // std::vector<GLenum> glShaderIDs(2);
  ```

  shaderSources.size()是2，则glShaderIDs是一个两个大小的vector，并且vector的两个元素初始化为0。

  而顶点和片段着色器程序ID会在2和3的位置，这样会使加载着色器代码运行不正确

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307231749928.png)

  

- 正确写法是：

  1. 初始化大小但是不初始华元素

     ```cpp
     std::vector<GLenum> glShaderIDs();
     glShaderIDs.reserve(2);// 只申请2个大小的空间，但不初始化这2个空间上的元素为0
     ```

  2. 换成array（array存储的数据在栈内存中）

     vector存储的数据是存放在**堆**里，动态调整内存会影响性能。换成array，在编译时就确定了大小。

     ```cpp
     std::array<GLenum, 2> glShaderIDs;// 大小为2
     int glShaderIDIndex = 0;
     ```

### ifstream打开的参数多了

```c++
std::ifstream in(filepath, std::ios::in, std::ios::binary);// 二进制读取？为什么还是保持字符串的形式？
```

改为

```c++
std::ifstream in(filepath, std::ios::in | std::ios::binary);
```

## 前言

- 为什么要Shader库

  为了重复使用的shader，存储在cpu中需要的时候使用，不用再创建。

- 如何存储

  map键值对

  键：shader名称

  值：引用智能指针指向Shader

## 关键代码

从文件读取，根据文件名设置Map的键值

```c++
OpenGLShader::OpenGLShader(const std::string& filepath)
{
    std::string source = ReadFile(filepath);
    HZ_CORE_ASSERT(source.size(), "GLSL读取的字符串为空");
    auto shaderSources = PreProcess(source);
    Compile(shaderSources);
    /*
    asserts\shaders\Texture.glsl
    asserts/shaders/Texture.glsl
    Texture.glsl
    */
    auto lastSlash = filepath.find_last_of("/\\");// 字符串中最后一个正斜杠或者反斜杠
    lastSlash = lastSlash == std::string::npos ? 0 : lastSlash + 1;
    auto lastDot = filepath.rfind('.');
    auto count = lastDot == std::string::npos ? filepath.size() - lastSlash : lastDot - lastSlash;
    m_Name = filepath.substr(lastSlash, count);// Texture.glsl
}
```

## 代码修改

- Shader

  ```cpp
  class ShaderLibrary {
  public:
      void Add(const std::string& name, const Ref<Shader>& shader);
      void Add(const Ref<Shader>& shader);
      Ref<Shader> Load(const std::string& filepath);
      Ref<Shader> Load(const std::string& name, const std::string& filepath);
  
      Ref<Shader> Get(const std::string &name);
  
      bool Exists(const std::string& name) const;
  private:
      std::unordered_map<std::string, Ref<Shader>> m_Shaders;
  };
  ```

  ```cpp
  void ShaderLibrary::Add(const Ref<Shader>& shader)
  {
      auto& name = shader->GetName();
      Add(name, shader);
  }
  void ShaderLibrary::Add(const std::string& name, const Ref<Shader>& shader)
  {
      HZ_CORE_ASSERT(!Exists(name), "着色器名称已经存在！");
      m_Shaders[name] = shader;
  }
  Ref<Shader> ShaderLibrary::Load(const std::string& filepath)
  {
      auto shader = Shader::Create(filepath);
      Add(shader);
      return shader;
  }
  Ref<Shader> ShaderLibrary::Load(const std::string& name, const std::string& filepath)
  {
      auto shader = Shader::Create(filepath);
      Add(name, shader);
      return shader;
  }
  Ref<Shader> ShaderLibrary::Get(const std::string& name)
  {
      HZ_CORE_ASSERT(Exists(name), "这个名称的着色器没找到");
      return m_Shaders[name];
  }
  bool ShaderLibrary::Exists(const std::string& name) const
  {
      return m_Shaders.find(name) != m_Shaders.end();
  }
  ```

- Sandboxapp.cpp

  ```cpp
  // 属性添加shaderlibrary
  // shader库
  Hazel::ShaderLibrary m_ShaderLibrary;
  ......
  // 从字符串编译shader
  //m_SquareShader.reset(Hazel::Shader::Create(squareShaderVertexSrc, squareShaderfragmentSrc));
  m_SquareShader = Hazel::Shader::Create("squareTexColorShader", squareShaderVertexSrc, squareShaderfragmentSrc);
  
  // 加载glsl文件编译shader
  //m_SquareTexCoordShader = (Hazel::Shader::Create("asserts/shaders/Texture.glsl"));
  auto m_SquareTexCoordShader = m_ShaderLibrary.Load("asserts/shaders/Texture.glsl");
  
  // 使用
  // 用shader库获取shader
  auto m_SquareTexCoordShader = m_ShaderLibrary.Get("Texture");
  
  // 0.带纹理的正方形
  m_SquareTexture->Bind();
  glm::mat4 squareTexCoordtransfrom = glm::translate(glm::mat4(1.0f), { 0.0f, 0.0f, 0.0f });
  Hazel::Renderer::Submit(m_SquareTexCoordShader, m_SquareTexCoordVertexArray, squareTexCoordtransfrom);
  ```

  从中看出，只有从glsl文件加载来的才用map存储了，字符串编译shader并没有保存在map中

# 046如何建立一个2D渲染器

## 前言

- 此节目的

  只是设计2D渲染器。

- 疑问

  现在项目中**已有**一个简单的2D渲染，为什么**还要**建立一个2D渲染器？

- 目前的2D渲染

  Renderer类

  ```cpp
  Hazel::Renderer::BeginScene(m_Camera);
  Hazel::Renderer::Submit(m_SquareTexCoordShader, m_SquareTexCoordVertexArray, squareTexCoordtransfrom);
  ```

  这个代码耦合太高，**无法绘制<font color="red">单个</font>图形**。

- 新设计的API代码

  增加Renderer2D、Renderer3D类

  ```cpp
  Hazel::Renderer2D::DrawCube();
  Hazel::Renderer3D::DrawCube();
  ```

  这个API使得我们能**单独**绘制一个Cube、或者三角形等

## 2D渲染器组成与说明

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307231817187.png)

- 批处理渲染

  比如有成千上万的quad并带有纹理，渲染它不可能一个一个提交渲染，需要批处理

- 纹理Altas

  纹理集，多个纹理组成一张大的纹理图片

- sprite动画

  如果sprite像素**低**，像处理**纹理Altas**一样，由动画序列帧组成一张动画图片，然后读取

  如果sprite像素**高**，需要用**关键帧**，类似视频编码解码的技术

- UI

  布局系统，需要在不同分辨率手机上显示差不多，很难处理的一部分，3D同样需要2DUI

- 后期处理

  粒子效果动态的，还有背景模糊、bloom

- 交互功能

  - 脚本语言
  - ECS系统，可组合的游戏对象
    - Transform变换
    - 2D渲染
    - Sprite
