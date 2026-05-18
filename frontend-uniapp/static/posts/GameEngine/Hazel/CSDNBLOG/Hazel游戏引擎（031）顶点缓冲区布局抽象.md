> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  抽象**顶点缓冲布局**类：给出对应顶点着色器输入一样的格式，使能够**自动**计算每个属性的偏移量、分量大小，总大小，而不用手动计算

- 更详细讨论：为什么要顶点缓冲区布局抽象类

  - directx有缓冲区布局

  - 有了后可以**自动计算**大小和偏移量，以及能在布局就能看到顶点缓冲区、顶点着色器输入数据的结构，而不用手动计算

    ```cpp
    // 手动计算与输入
    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), nullptr);
    ```

- 从Api出发设计抽象顶点缓冲布局类

  ```cpp
  BufferLayout layout = {//BufferLayout是顶点缓冲布局类
      { ShaderDataType::Float3, "a_Position" },// 一个元素是BufferElement类
      { ShaderDataType::Float4, "a_Color" }
  };
  m_VertexBuffer->SetLayout(layout);//  顶点缓冲布局类与顶点缓冲交互
  // 设置顶点属性指针
  glEnableVertexAttribArray(index);
  glVertexAttribPointer(index,element.GetComponentCount(), ShaderDataTypeToOpenGLBaseType(element.Type),element.Normalized ? GL_TRUE : GL_FALSE,layout.GetStride(),(const void*)element.Offset);// 使用顶点缓冲布局类的函数
  ```

- 此节完成后的类图

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306262323210.png)

  

# 项目相关

## 代码

- 在Buffer.h增加顶点属性布局抽象类

  ```cpp
  // Shdader数据类型
  enum class ShaderDataType{
      None = 0, Float, Float2, Float3, Float4, Mat3, Mat4, Int, Int2, Int3, Int4, Bool
  };
  // 获取Shader数据类型的大小
  static uint32_t ShaderDataTypeSize(ShaderDataType type){
      switch (type){
          case ShaderDataType::Float:    return 4;
          case ShaderDataType::Float2:   return 4 * 2;
          case ShaderDataType::Float3:   return 4 * 3;
          case ShaderDataType::Float4:   return 4 * 4;
          case ShaderDataType::Mat3:     return 4 * 3 * 3;
          case ShaderDataType::Mat4:     return 4 * 4 * 4;
          case ShaderDataType::Int:      return 4;
          case ShaderDataType::Int2:     return 4 * 2;
          case ShaderDataType::Int3:     return 4 * 3;
          case ShaderDataType::Int4:     return 4 * 4;
          case ShaderDataType::Bool:     return 1;
      }
      HZ_CORE_ASSERT(false, "Unknown ShaderDataType!");
      return 0;
  }
  // 一个Shader属性类
  struct BufferElement{ 	// 对应：{ ShaderDataType::Float3, "a_Position" }
      std::string Name;	// 名称：没太大作用，只是标识而已
      ShaderDataType Type;// Shader数据类型
      uint32_t Size;		// 此属性的大小
      uint32_t Offset;	// 此属性的偏移量
      bool Normalized;	// 是否规范化
      BufferElement() {}
      BufferElement(ShaderDataType type, const std::string& name, bool normalized = false)
          : Name(name), Type(type), Size(ShaderDataTypeSize(type)), Offset(0), Normalized(normalized)
          { }
      // 获取此属性有几个分量
      uint32_t GetComponentCount() const{
          switch (Type) {
              case ShaderDataType::Float:   return 1;
              case ShaderDataType::Float2:  return 2;
              case ShaderDataType::Float3:  return 3;
              case ShaderDataType::Float4:  return 4;
              case ShaderDataType::Mat3:    return 3 * 3;
              case ShaderDataType::Mat4:    return 4 * 4;
              case ShaderDataType::Int:     return 1;
              case ShaderDataType::Int2:    return 2;
              case ShaderDataType::Int3:    return 3;
              case ShaderDataType::Int4:    return 4;
              case ShaderDataType::Bool:    return 1;
          }
          HZ_CORE_ASSERT(false, "Unknown ShaderDataType!");
          return 0;
      }
  };
  // 顶点缓冲布局抽象类
  class BufferLayout{
      public:
      BufferLayout() {}
      // 用初始化列表构造BufferLayout对象
      BufferLayout(const std::initializer_list<BufferElement>& elements)
          : m_Elements(elements)
          {
              CalculateOffsetsAndStride();
          }
      inline uint32_t GetStride() const { return m_Stride; }// 获取属性列表总大小
      inline const std::vector<BufferElement>& GetElements() const { return m_Elements; }// 获取元素列表
      // 写vector的begin与end，以便循环BufferLayout类 for (const auto& element : BufferLayout)
      std::vector<BufferElement>::iterator begin() { return m_Elements.begin(); }
      std::vector<BufferElement>::iterator end() { return m_Elements.end(); }
      std::vector<BufferElement>::const_iterator begin() const { return m_Elements.begin(); }
      std::vector<BufferElement>::const_iterator end() const { return m_Elements.end(); }
  private:
      //////////////////////////////////////////////////////////////////////////
      // 计算属性列表各个属性的偏移量，以及总大小//////////////////////////////////////
      void CalculateOffsetsAndStride(){
          uint32_t offset = 0;
          m_Stride = 0;
          for (auto& element : m_Elements){
              element.Offset = offset;
              offset += element.Size;
              m_Stride += element.Size;
          }
      }
      private:
      std::vector<BufferElement> m_Elements;
      uint32_t m_Stride = 0;
  };
  ```

- Application.cpp

  ```cpp
  // 将自定义的Shader类型转换为OpenGL定义的类型：临时的，会放在顶点数组抽象类中
  static GLenum ShaderDataTypeToOpenGLBaseType(ShaderDataType type){
      switch (type){
          case Hazel::ShaderDataType::Float:    return GL_FLOAT;
          case Hazel::ShaderDataType::Float2:   return GL_FLOAT;
          case Hazel::ShaderDataType::Float3:   return GL_FLOAT;
          case Hazel::ShaderDataType::Float4:   return GL_FLOAT;
          case Hazel::ShaderDataType::Mat3:     return GL_FLOAT;
          case Hazel::ShaderDataType::Mat4:     return GL_FLOAT;
          case Hazel::ShaderDataType::Int:      return GL_INT;
          case Hazel::ShaderDataType::Int2:     return GL_INT;
          case Hazel::ShaderDataType::Int3:     return GL_INT;
          case Hazel::ShaderDataType::Int4:     return GL_INT;
          case Hazel::ShaderDataType::Bool:     return GL_BOOL;
      }
      return 0;
  }
  Application::Application(){
      // 使用OpenGL函数渲染一个三角形
      // 顶点数据
      float vertices[3 * 7] = {
          -0.5f, -0.5f, 0.0f, 0.8f, 0.2f, 0.8f, 1.0f,
          0.5f, -0.5f, 0.0f, 0.2f, 0.3f, 0.8f, 1.0f,
          0.0f,  0.5f, 0.0f, 0.8f, 0.8f, 0.2f, 1.0f
      };
      unsigned int indices[3] = { 0, 1, 2 }; // 索引数据
      // 0.生成顶点数组对象VAO、顶点缓冲对象VBO、索引缓冲对象EBO
      glGenVertexArrays(1, &m_VertexArray);
      // 1. 绑定顶点数组对象
      glBindVertexArray(m_VertexArray);
      // 2.1顶点缓冲
      m_VertexBuffer.reset(VertexBuffer::Create(vertices, sizeof(vertices)));
      ////////////////////////////////////////////////////////////////////////
      // 2.2 设定顶点属性指针，来解释顶点缓冲中的顶点属性布局/////////////////////////
      ////////////////////////////////////////////////////////////////////////
      {
          BufferLayout layout = {
              { ShaderDataType::Float3, "a_Position" },
              { ShaderDataType::Float4, "a_Color" }
          };
          m_VertexBuffer->SetLayout(layout);
      }
      // ：临时的，会放在顶点数组抽象类中
      uint32_t index = 0;
      const auto& layout = m_VertexBuffer->GetLayout();
      for (const auto& element : layout){
          glEnableVertexAttribArray(index);
          glVertexAttribPointer(index,
                                element.GetComponentCount(),
                                ShaderDataTypeToOpenGLBaseType(element.Type),
                                element.Normalized ? GL_TRUE : GL_FALSE,
                                layout.GetStride(),
                                (const void*)element.Offset);
          index++;
      }
      // 之前手动
      //glEnableVertexAttribArray(0);// 开启glsl的layout = 0输入
      //glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), nullptr);
      // 3.索引缓冲
      m_IndexBuffer.reset(IndexBuffer::Create(indices, sizeof(indices) / sizeof(uint32_t)));
      // 着色器代码
      std::string vertexSrc = R"(
  			#version 330 core
  
  			layout(location = 0) in vec3 a_Position;
  			layout(location = 1) in vec4 a_Color;
  			out vec3 v_Position;
  			out vec4 v_Color;
  			void main()
  			{
  				v_Position = a_Position;
  				v_Color = a_Color;
  				gl_Position = vec4(a_Position, 1.0);	
  			}
  		)";
      std::string fragmentSrc = R"(
  			#version 330 core
  			layout(location = 0) out vec4 color;
  			in vec3 v_Position;
  			in vec4 v_Color;
  			void main()
  			{
  				color = vec4(v_Position * 0.5 + 0.5, 1.0);
  				color = v_Color;
  			}
  		)";
      m_Shader.reset(new Shader(vertexSrc, fragmentSrc));
  ```

## 效果

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306262323212.png)

# C++知识：初始化列表

- 引入

  在Buffer.h的BufferLayout的构造函数使用**初始化列表**（initializer_list）构造，而不是使用vector**引用**（vector<BufferElement>&）来构造，这可以**减少**BufferElement调用复制构造函数的次数

  - 初始化列表：initializer_list

    ```cpp
    BufferLayout(const std::initializer_list<BufferElement>& elements)
        : m_Elements(elements)
        {
            CalculateOffsetsAndStride();
        }
    BufferLayout layout = {
        { ShaderDataType::Float3, "a_Position" },
        { ShaderDataType::Float4, "a_Color" }
    };
    m_VertexBuffer->SetLayout(layout);
    ```

  - vector引用：vector<BufferElement>&

    ```cpp
    BufferLayout(const std::vector<BufferElement>& elements)
        : m_Elements(elements)
        {
            CalculateOffsetsAndStride();
        }
    // 注意：这里变成vector////////////////////////////
    std::vector<BufferElement> vec1 = {
        { ShaderDataType::Float3, "a_Position" },
        { ShaderDataType::Float4, "a_Color" }
    };
    m_VertexBuffer->SetLayout(vec1);
    ```

- 说明vector引用会多调用几次复制构造函数

  ```cpp
  #include <iostream>
  #include <vector>
  using namespace std;
  
  class TestClass {
  public:
  	TestClass() :val(0) { cout << "TestClass()" << endl; }
  	TestClass(int v) :val(v) { cout << "TestClass(int v)" << endl; }
  	// 复制构造函数
  	TestClass(const TestClass& b) {
  		cout << "TestClass的复制构造函数" << endl;
  		val = b.val;
  	}
  	int val;
  };
  class TestVectorClass {
  public:
  	TestVectorClass(){}
  	TestVectorClass(vector<TestClass>& v):vec(v) {
  		cout << "--vector参数引用构造TestVectorClass结束--" << endl;
  	}
  	TestVectorClass(const initializer_list<TestClass>& v):vec(v){
  		cout << "--直接初始化列表构造TestVectorClass结束--" << endl;
  	}
  	vector<TestClass> vec;
  };
  int main() {
  	cout << "--vector<TestClass>初始化开始--" << endl;
  	// vector<TestClass>初始化，{1, 2, 3}会先调用构造函数临时对象，再调用TestClass复制构造函数给vec的下标元素
  	vector<TestClass> vec = {1, 2, 3};
  	cout << "--vector<TestClass&>初始化结束--" << endl;
  
  	cout << "--vector参数引用构造TestVectorClass开始--" << endl;
  	TestVectorClass tv1(vec);
  	cout << "----------------------------" << endl;
  
  	cout << "--直接初始化列表构造TestVectorClass开始--" << endl;
  	TestVectorClass tv = { 1, 2, 3 };
  	return 0;
  };
  ```

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306262323632.png)



# 顶点缓冲区布局和着色器<联系>在一起的草稿图

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306262323509.jpg)

