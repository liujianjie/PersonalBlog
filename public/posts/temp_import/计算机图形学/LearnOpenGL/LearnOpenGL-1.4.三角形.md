

[toc]

# 图形渲染管线

## 基本介绍

- 功能

  将3D坐标变为2D坐标

  将2D坐标转换为实际的有颜色的像素


- 图形渲染管线与着色器

  图形渲染管线分为多个阶段，多个阶段对应多个自己特定的函数（小程序），在各自特定的函数可并行执行调用显卡的成千上万的核心，这些小程序被称为**着色器**

## 着色器阶段

![](图片/1.4三角形/pipeline.png)

- 顶点数据

  以**数组**的形式传递3个3D坐标作为图形渲染管线的输入，用来表示一个三角形，这个数组叫做顶点数据(Vertex Data)

- 顶点着色器

  - 它把一个单独的顶点作为输入
  - 主要的目的是把3D坐标转为另一种3D坐标

- 形状（图元）装配

  将顶点着色器**输出**的所有顶点作为**输入**（如果是GL_POINTS，那么就是一个顶点），并所有的点装配成指定图元的形状

- 几何着色器

  - 把图元形式的一系列顶点的集合作为输入
  - 它可以通过产生新顶点构造出**新的**（或是其它的）图元来生成其他形状

- 光栅化

  - 把图元映射为最终屏幕上相应的像素，生成供片段着色器(Fragment Shader)使用的片段(Fragment)
  - 在片段着色器运行之前会执行裁切(Clipping)。裁切会丢弃超出你的视图以外的所有像素，用来提升执行效率。

- 片段着色器

  片段着色器的主要目的是计算一个像素的最终**颜色**

- Alpha测试和混合

  - 检测片段的对应的深度（和模板(Stencil)）值（后面会讲），用它们来判断这个像素是其它物体的前面还是后面，决定是否应该**丢弃**

  - 检查alpha值（alpha值定义了一个物体的透明度）并对物体进行**混合**(Blend)，可以认为改变片段的颜色

在现代OpenGL中，我们**必须**定义至少一个顶点着色器和一个片段着色器（因为GPU中没有默认的顶点/片段着色器）。

# 顶点输入

- 标准化设备坐标

  - 在顶点着色器中处理过，它们就应该是**标准化设备坐标**，x、y和z值在-1.0到1.0的一小段空间

  - 图示

    ![](图片/1.4三角形/ndc.png)

- 顶点数据

  ```cpp
  float vertices[] = {
      -0.5f, -0.5f, 0.0f,
       0.5f, -0.5f, 0.0f,
       0.0f,  0.5f, 0.0f
  };
  ```

  一个在CPU内存的数组

- 顶点缓冲对象VBO

  由于CPU内存的顶点数据需要传入GPU内存中，就需要在GPU内存中存储同样大小的顶点数据，而顶点缓冲对象管理这个在GPU上的内存（有点模糊这个概念）

  ```cpp
  unsigned int VBO;
  // 1.在GPU上生成一个缓冲，返回ID
  glGenBuffers(1, &VBO);
  // 2.绑定缓冲
  glBindBuffer(GL_ARRAY_BUFFER, VBO);
  // 3.CPU内存的顶点数据复制到GPU内存中
  glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
  ```


# 着色器代码流程

- 创建一个**着色器对象**

  用glCreateShader创建这个着色器

  ```cpp
  unsigned int vertexShader;
  vertexShader = glCreateShader(GL_VERTEX_SHADER);
  ```

- 着色器源码附加到着色器对象

  ```cpp
  glShaderSource(vertexShader, 1, &vertexShaderSource, NULL);
  ```

- 编译着色器

  ```cpp
  glCompileShader(vertexShader);
  ```

  编译完顶点着色器后，片段着色器同样这样编译

- 两个着色器对象链接到一个用来渲染的**着色器程序**

  - 创建一个**着色器程序**对象

    ```cpp
    unsigned int shaderProgram;
    shaderProgram = glCreateProgram();
    ```

  - 编译的着色器**附加**到**着色器程序**对象

    ```cpp
    glAttachShader(shaderProgram, vertexShader);
    glAttachShader(shaderProgram, fragmentShader);
    ```

  - glLinkProgram链接**着色器程序对象**

    ```cpp
    glLinkProgram(shaderProgram);
    ```

- 使用着色器程序

  ```cpp
  glUseProgram(shaderProgram);
  ```

- 着色器对象链接到着色器**程序**对象以后，删除着色器对象

  ```cpp
  glDeleteShader(vertexShader); 
  glDeleteShader(fragmentShader);
  ```

- 另外

  在编译着色器对象和链接时可以看是否成功
  
  ```cpp
  int  success;
  char infoLog[512];
  glGetShaderiv(vertexShader, GL_COMPILE_STATUS, &success);
  if(!success)
  {
      glGetShaderInfoLog(vertexShader, 512, NULL, infoLog);
      std::cout << "ERROR::SHADER::VERTEX::COMPILATION_FAILED\n" << infoLog << std::endl;
  }
  ```

# 链接顶点属性

- 我们必须手动指定顶点输入数据的哪一个部分对应**顶点着色器**的**哪一个顶点属性**

  ![](图片/1.4三角形/vertex_attribute_pointer.png)

  ```cpp
  glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
  // 若第一个参数为0，对应顶点着色器的layout(location = 0) in vec3 a_Position;
  // 若第一个参数为1，对应顶点着色器的layout(location = 1) in vec4 a_Color;
  glEnableVertexAttribArray(0);// 代表启用顶点着色器location=0的输入
  ```

  设置好OpenGL如何解释顶点数据，但是设置的顶点数据来源于上一次将**顶点缓冲对象**绑定的那个VBO。

  glVertexAttribPointer参数：

  - 1：要配置的顶点属性

    layout(location = 0)

  - 2：顶点属性的大小

  - 3：数据的类型

  - 4：是否希望数据被标准化

    GL_TRUE：所有数据都会被映射到0（对于有符号型signed数据是-1）到1之间

  - 5：步长

  - 6：偏移量

- 由此绘制的代码

  ```cpp
  // 省略创建缓冲
  // 0. CPU内存的顶点数据复制到GPU内存中
  glBindBuffer(GL_ARRAY_BUFFER, VBO1);
  glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
  // 1. 设置顶点属性指针
  glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
  glEnableVertexAttribArray(0);
  // 2. 当我们渲染一个物体时要使用着色器程序
  glUseProgram(shaderProgram);
  // 3. 绘制物体
  someOpenGLFunctionThatDrawsOurTriangle();
  ```

  若有第二个不同的物体（不同的顶点数据）需要渲染

  ```cpp
  又要写一遍这个代码
  // 0. CPU内存的顶点数据复制到GPU内存中
  glBindBuffer(GL_ARRAY_BUFFER, VBO2);
  glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
  // 1. 设置顶点属性指针
  glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
  glEnableVertexAttribArray(0);
  // 2. 当我们渲染一个物体时要使用着色器程序
  glUseProgram(shaderProgram);
  // 3. 绘制物体
  someOpenGLFunctionThatDrawsOurTriangle();
  ```

- 缺点

  由上可看出，有多少个物体，就得重复写绑定的顶点缓冲区、顶点属性指针，属实麻烦，则应该使用**顶点数组对象VAO**

# 顶点数组对象VAO

- 使用这个有什么用

  原话：

  - 当配置顶点属性指针时，你只需要将那些调用执行一次，之后再绘制物体的时候只需要绑定相应的VAO就行了。

  - 这使在不同顶点数据和属性配置之间切换变得非常简单，只需要绑定不同的VAO就行了。刚刚设置的所有状态都将存储在VAO中

  我认为：

  - **顶点数组对象VAO与顶点缓冲对象VBO一对多**，一个VAO的顶点属性指针可以来源于多个不同的顶点缓冲对象，在初始化时VAO设置好顶点属性指针后，绘制的时候绑定对应的VAO就行，不需要写绑定顶点缓冲与设置顶点属性指针的代码了，可以在绘制时无关初始化设置状态的代码。

- 代码角度

  ```cpp
  // ..:: 初始化代码（只运行一次 (除非你的物体频繁改变)） :: ..
  unsigned int VAO;
  glGenVertexArrays(1, &VAO);
  // 1. 绑定VAO
  glBindVertexArray(VAO);
  // 2. 把顶点数组复制到缓冲中供OpenGL使用
  glBindBuffer(GL_ARRAY_BUFFER, VBO);
  glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
  // 3. 设置顶点属性指针
  glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
  glEnableVertexAttribArray(0);
  
  [...]
  
  // ..:: 绘制代码（渲染循环中） :: ..
  // 4. 绘制物体
  glUseProgram(shaderProgram);
  glBindVertexArray(VAO);
  someOpenGLFunctionThatDrawsOurTriangle();
  ```

  若有第二个物体要绘制，跟上一样，在初始化部分**绑定**相应顶点缓冲对象设置顶点属性后，在渲染绘制代码只要切换VAO就行

  ```cpp
  // 4. 绘制物体
  glUseProgram(shaderProgram);
  glBindVertexArray(VAO);
  someOpenGLFunctionThatDrawsOurTriangle();
  
  glUseProgram(shaderProgram2);
  glBindVertexArray(VAO2);
  someOpenGLFunctionThatDrawsOurTriangle();
  ```

- 图片角度

  ![](图片/1.4三角形/1.VAO图.png)

  如图：VAO与VBO一一对应，但实际上VAO的顶点属性指针可以来源于多个不同的顶点缓冲VBO，一般是一一对应

# 绘制三角形

- 代码

  glsl

  ```cpp
  version 330 core
  layout (location = 0) in vec3 aPos;
  void main()
  {
     gl_Position = vec4(aPos.x, aPos.y, aPos.z, 1.0);\n"
  }
  ```

  ```cpp
  #version 330 core
  out vec4 FragColor;
  void main()
  {
     FragColor = vec4(1.0f, 0.5f, 0.2f, 1.0f);
  }
  ```

  cpp

  ```cpp
  // 0.顶点数据
  float vertices[] = {
      -0.5f, -0.5f, 0.0f, // left  
      0.5f, -0.5f, 0.0f, // right 
      0.0f,  0.5f, 0.0f  // top   
  };
  unsigned int VBO, VAO;
  glGenVertexArrays(1, &VAO);
  glGenBuffers(1, &VBO);
  // bind the Vertex Array Object first, then bind and set vertex buffer(s), and then configure vertex attributes(s).
  // 1. 绑定顶点数组对象
  glBindVertexArray(VAO);
  // 2. 把我们的CPU的顶点数据复制到GPU顶点缓冲中，供OpenGL使用
  glBindBuffer(GL_ARRAY_BUFFER, VBO);
  glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
  // 3. 设定顶点属性指针，来解释顶点缓冲中的顶点属性布局
  glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
  glEnableVertexAttribArray(0);
  while (!glfwWindowShouldClose(window))
  {
      .....
      // 4.使用着色器程序对象
      glUseProgram(shaderProgram);
      // 5.绑定顶点数组对象，并绘制
      glBindVertexArray(VAO); 
  	glDrawArrays(GL_TRIANGLES, 0, 3);// 这里
     	.....
  }
  ```

- 效果

![](图片/1.4三角形/1.效果.png)

# 元素（索引）缓冲对象EBO

- 简介

  绘制矩形，有重复的顶点，正确使用索引顺序绘制图形**可以重复利用顶点**从而减少顶点数据。

- 使用

  和VBO同样的生成使用方法，生成EBO缓冲区返回ID、绑定ID、设置索引数据、绑定在VAO上

  绘制不同：

  用**glDrawElements**(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);代替**glDrawArrays**(GL_TRIANGLES, 0, 3);

- 图示

  ![](图片/1.4三角形/2.1VAO图带有索引.png)

  由图可见，VAO索引缓冲区的指针只有一个，且在最后
  
- 代码

  glsl不变
  
  ```cpp
  version 330 core
  layout (location = 0) in vec3 aPos;
  void main()
  {
     gl_Position = vec4(aPos.x, aPos.y, aPos.z, 1.0);\n"
  }
  ```
  
  ```cpp
  #version 330 core
  out vec4 FragColor;
  void main()
  {
     FragColor = vec4(1.0f, 0.5f, 0.2f, 1.0f);
  }
  ```
  
  cpp
  
  ```cpp
  // 0.1顶点数据
  float vertices[] = {
      0.5f,  0.5f, 0.0f,  // top right
      0.5f, -0.5f, 0.0f,  // bottom right
      -0.5f, -0.5f, 0.0f,  // bottom left
      -0.5f,  0.5f, 0.0f   // top left 
  };
  // 0.2索引数据
  unsigned int indices[] = {  // note that we start from 0!
      0, 1, 3,  // first Triangle
      1, 2, 3   // second Triangle
  };
  
  unsigned int VBO, VAO, EBO;
  glGenVertexArrays(1, &VAO);
  glGenBuffers(1, &VBO);
  glGenBuffers(1, &EBO);
  // bind the Vertex Array Object first, then bind and set vertex buffer(s), and then configure vertex attributes(s).
  // 1. 绑定顶点数组对象
  glBindVertexArray(VAO);
  // 2. 把我们的CPU的顶点数据复制到GPU顶点缓冲中，供OpenGL使用
  glBindBuffer(GL_ARRAY_BUFFER, VBO);
  glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
  // 3. 复制我们的CPU的索引数组到GPU索引缓冲中，供OpenGL使用
  glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, EBO);
  glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(indices), indices, GL_STATIC_DRAW);
  // 4. 设定顶点属性指针，来解释顶点缓冲中的顶点属性布局
  glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
  glEnableVertexAttribArray(0);
  while (!glfwWindowShouldClose(window))
  {
      .....
      // 5.使用着色器程序对象
      glUseProgram(shaderProgram);
      // 6.绑定顶点数组对象，并绘制
      glBindVertexArray(VAO); 
  	//glDrawArrays(GL_TRIANGLES, 0, 3);
      glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);// 这里不同
      // 由于只有一个顶点数组对象，不需要解绑
     	.....
  }
  ```
  
- 效果

  ![](图片/1.4三角形/2.效果.png)

# 小结

## 草稿图

![](图片/自己理解的/20230211理解OpenGL布局.jpg)

## 重复重要的流程

### 着色器流程

- 顶点着色器

  - 创建顶点着色器对象

  - 附加源码给顶点着色器对象

  - 编译顶点着色器对象

    可以打印是否编译成功

- 片段着色器同上

- 着色器程序

  - 创建着色器程序对象

  - 附加着色器对象给着色器**程序**对象

  - 链接着色器程序对象

    可以检查是否成功

  - 删除着色器对象

```cpp
const char* vShaderCode = vertexCode.c_str();
const char* fShaderCode = fragmentCode.c_str();
unsigned int vertex, fragment;
// 1.1创建顶点着色器对象
vertex = glCreateShader(GL_VERTEX_SHADER);
// 1.2附加顶点着色器源码给顶点着色器对象
glShaderSource(vertex, 1, &vShaderCode, NULL);
// 1.3编译顶点着色器对象
glCompileShader(vertex);
// 1.4检测是否编译成功
checkCompileErrors(vertex, "VERTEX");
// 2.1创建片段着色器对象
fragment = glCreateShader(GL_FRAGMENT_SHADER);
// 2.2附加片段着色器源码给片段着色器对象
glShaderSource(fragment, 1, &fShaderCode, NULL);
// 2.3编译片段着色器对象
glCompileShader(fragment);
// 2.4检测是否编译成功
checkCompileErrors(fragment, "FRAGMENT");

// 3.1创建着色器程序对象
ID = glCreateProgram();
// 3.2附加着色器对象给着色器程序对象
glAttachShader(ID, vertex);
glAttachShader(ID, fragment);
// 3.3链接着色器程序对象
glLinkProgram(ID);
checkCompileErrors(ID, "PROGRAM");// 可以检查是否成功
// 4.删除着色器对象
glDeleteShader(vertex);
glDeleteShader(fragment);

void checkCompileErrors(unsigned int shader, std::string type)
{
    int success;
    char infoLog[1024];
    if (type != "PROGRAM")
    {
        glGetShaderiv(shader, GL_COMPILE_STATUS, &success);
        if (!success)
        {
            glGetShaderInfoLog(shader, 1024, NULL, infoLog);
            std::cout << "ERROR::SHADER_COMPILATION_ERROR of type: " << type << "\n" << infoLog << "\n -- --------------------------------------------------- -- " << std::endl;
        }
    }
    else
    {
        glGetProgramiv(shader, GL_LINK_STATUS, &success);
        if (!success)
        {
            glGetProgramInfoLog(shader, 1024, NULL, infoLog);
            std::cout << "ERROR::PROGRAM_LINKING_ERROR of type: " << type << "\n" << infoLog << "\n -- --------------------------------------------------- -- " << std::endl;
        }
    }
}
```

### 绘制流程

- 顶点数组对象
  - 创建顶点数组对象
  - 绑定顶点数组对象
- 顶点缓冲对象
  - 创建顶点缓冲对象
  - 绑定顶点缓冲对象
  - 将顶点数据从CPU拷贝到GPU的顶点缓冲对象中
  - 设置**顶点数组里的顶点属性指针**，解释此顶点缓冲区的布局
- 索引缓冲对象
  - 创建索引缓冲对象
  - 绑定索引缓冲对象，当前绑定顶点数组对象的索引缓冲对象指针会指向当前索引缓冲对象（自己的语言）
  - 将索引数据从CPU拷贝到GPU的索引缓冲对象中
- 绘制代码
  - 使用**着色器程序对象**
  - 绑定**顶点数组对象**
  - 绘制元素
  - 解绑顶点数组对象

```cpp
// ..:: 初始化代码 :: ..
// 1. 绑定顶点数组对象
glBindVertexArray(VAO);
// 2. 把我们的CPU的顶点数据复制到GPU顶点缓冲中，供OpenGL使用
glBindBuffer(GL_ARRAY_BUFFER, VBO);
glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
// 3. 复制我们的CPU的索引数组到GPU索引缓冲中，供OpenGL使用
glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, EBO);
glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(indices), indices, GL_STATIC_DRAW);
// 4. 设定顶点属性指针，来解释顶点缓冲中的顶点属性布局
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
glEnableVertexAttribArray(0);

[...]

// ..:: 绘制代码（渲染循环中） :: ..
glUseProgram(shaderProgram);
glBindVertexArray(VAO);
glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);
glBindVertexArray(0);
```












