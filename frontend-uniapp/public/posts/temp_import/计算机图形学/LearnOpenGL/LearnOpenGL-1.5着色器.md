# 着色器

- 简介
  - 着色器(Shader)是运行在GPU上的小程序，分别对应渲染管理不同阶段。
  - 着色器是一种非常独立的程序，因为它们之间不能相互通信；它们之间唯一的沟通只有通过输入和输出。

# GLSL

- 简介
  - 着色器是GLSL的类C语言写成的
  - 着色器的开头总是要声明版本，接着是输入和输出变量、uniform和main函数。每个着色器的入口点都是main函数。
  - main函数：在这个函数中我们处理所有的输入变量，并将结果输出到输出变量中

- 结构

  ```cpp
  #version version_number
  in type in_variable_name;
  in type in_variable_name;
  
  out type out_variable_name;
  
  uniform type uniform_name;
  
  int main()
  {
    // 处理输入并进行一些图形操作
    ...
    // 输出处理过的结果到输出变量
    out_variable_name = weird_stuff_we_processed;
  }
  ```

  说明：

  - 当我们特别谈论到顶点着色器的时候，每个输入变量也叫**顶点属性**。

  - 我们能声明的顶点属性是有上限的，它一般由硬件来决定。

  - OpenGL确保至少有16个包含4分量的顶点属性可用，但是有些硬件或许允许更多的顶点属性，你可以查询GL_MAX_VERTEX_ATTRIBS来获取具体的上限

    ```cpp
    xint nrAttributes;glGetIntegerv(GL_MAX_VERTEX_ATTRIBS, &nrAttributes);std::cout << "Maximum nr of vertex attributes supported: " << nrAttributes << std::endl;
    ```

## 数据类型

| 类型    | 含义                            |
| :------ | :------------------------------ |
| `vecn`  | 包含`n`个float分量的默认向量    |
| `bvecn` | 包含`n`个bool分量的向量         |
| `ivecn` | 包含`n`个int分量的向量          |
| `uvecn` | 包含`n`个unsigned int分量的向量 |
| `dvecn` | 包含`n`个double分量的向量       |

## 输入与输出

- 输入与输出

  in和out：类型和名称要对得上

- 特殊的顶点着色器阶段

  需要用`layout (location = 0)`指定输入变量，来源于顶点数据（疑问：这个顶点数据在cpu还是gpu，应该是GPU，因为用了glBufferData从CPU拷贝到GPU上了）

- 例子

  顶点着色器

  ```cpp
  #version 330 core
  layout (location = 0) in vec3 aPos; // 位置变量的属性位置值为0
  
  out vec4 vertexColor; // 为片段着色器指定一个颜色输出
  
  void main()
  {
      gl_Position = vec4(aPos, 1.0); // 注意我们如何把一个vec3作为vec4的构造器的参数
      vertexColor = vec4(0.5, 0.0, 0.0, 1.0); // 把输出变量设置为暗红色
  }
  ```

  片段着色器

  ```cpp
  #version 330 core
  out vec4 FragColor;
  
  in vec4 vertexColor; // 从顶点着色器传来的输入变量（名称相同、类型相同）
  
  void main()
  {
      FragColor = vertexColor;
  }
  ```

## Uniform

- 简介

  是一种从CPU中的应用向GPU中的着色器发送数据的方式

- 与顶点属性不同

  - uniform是全局的(Global)，可以被着色器程序的任意着色器在任意阶段访问
  - 无论你把uniform值设置成什么，uniform会一直保存它们的数据，直到它们被重置或更新

- 使用例子

  ```cpp
  #version 330 core
  out vec4 FragColor;
  
  uniform vec4 ourColor; // 在OpenGL程序代码中设定这个变量
  
  void main()
  {
      FragColor = ourColor;
  }
  ```

  ```cpp
  float timeValue = glfwGetTime();
  float greenValue = (sin(timeValue) / 2.0f) + 0.5f;
  int vertexColorLocation = glGetUniformLocation(shaderProgram, "ourColor");
  glUseProgram(shaderProgram);
  // 发送数据
  glUniform4f(vertexColorLocation, 0.0f, greenValue, 0.0f, 1.0f);
  ```

  关键代码

  glGetUniformLocation(); 通过名称查询uniform ourColor的位置值

- 细节

  OpenGL在其核心是一个C库，所以无法重载，所以每个上传数据给Uniform的函数都不一样

  | `f`  | 函数需要一个float作为它的值          |
  | ---- | ------------------------------------ |
  | `i`  | 函数需要一个int作为它的值            |
  | `ui` | 函数需要一个unsigned int作为它的值   |
  | `3f` | 函数需要3个float作为它的值           |
  | `fv` | 函数需要一个float向量/数组作为它的值 |

  glUniform4f(vertexColorLocation, 0.0f, greenValue, 0.0f, 1.0f);

  在vertexColorLocation位置上上传4个float

## 更多属性

- 顶点数据

  ```cpp
  float vertices[] = {
      // 位置              // 颜色
       0.5f, -0.5f, 0.0f,  1.0f, 0.0f, 0.0f,   // 右下
      -0.5f, -0.5f, 0.0f,  0.0f, 1.0f, 0.0f,   // 左下
       0.0f,  0.5f, 0.0f,  0.0f, 0.0f, 1.0f    // 顶部
  };
  ```

- glsl

  ```cpp
  #version 330 core
  layout (location = 0) in vec3 aPos;   // 位置变量的属性位置值为 0 
  layout (location = 1) in vec3 aColor; // 颜色变量的属性位置值为 1
  
  out vec3 ourColor; // 向片段着色器输出一个颜色
  
  void main()
  {
      gl_Position = vec4(aPos, 1.0);
      ourColor = aColor; // 将ourColor设置为我们从顶点数据那里得到的输入颜色
  }
  ```

  ```cpp
  #version 330 core
  out vec4 FragColor;  
  in vec3 ourColor;
  
  void main()
  {
      FragColor = vec4(ourColor, 1.0);
  }
  ```

- 告诉OpenGL如何解读顶点缓冲中的顶点数据

  ```cpp
  // 位置属性
  glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 6 * sizeof(float), (void*)0);
  glEnableVertexAttribArray(0);
  // 颜色属性
  glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, 6 * sizeof(float), (void*)(3* sizeof(float)));
  glEnableVertexAttribArray(1);
  ```

- 图示

  ![](图片/1.5着色器/1.更多属性.png)

# 我们自己的着色器类

我只关心读取这段代码

```cpp
Shader(const char* vertexPath, const char* fragmentPath)
{
    // 1. 从文件路径中获取顶点/片段着色器
    std::string vertexCode;
    std::string fragmentCode;
    std::ifstream vShaderFile;
    std::ifstream fShaderFile;
    // 保证ifstream对象可以抛出异常：
    vShaderFile.exceptions (std::ifstream::failbit | std::ifstream::badbit);
    fShaderFile.exceptions (std::ifstream::failbit | std::ifstream::badbit);
    try 
    {
        // 打开文件
        vShaderFile.open(vertexPath);
        fShaderFile.open(fragmentPath);
        std::stringstream vShaderStream, fShaderStream;
        // 读取文件的缓冲内容到数据流中
        vShaderStream << vShaderFile.rdbuf();
        fShaderStream << fShaderFile.rdbuf();       
        // 关闭文件处理器
        vShaderFile.close();
        fShaderFile.close();
        // 转换数据流到string
        vertexCode   = vShaderStream.str();
        fragmentCode = fShaderStream.str();     
    }
    catch(std::ifstream::failure e)
    {
        std::cout << "ERROR::SHADER::FILE_NOT_SUCCESFULLY_READ" << std::endl;
    }
    const char* vShaderCode = vertexCode.c_str();
    const char* fShaderCode = fragmentCode.c_str();
    [...]
```

- 代码流程
  - 用了文件输入流：ifstream
  - 打开文件读取数据vShaderStream << vShaderFile.rdbuf();
  - 保存在stringstream类型对象中
  - 然后再转为string，再转为字符数组


