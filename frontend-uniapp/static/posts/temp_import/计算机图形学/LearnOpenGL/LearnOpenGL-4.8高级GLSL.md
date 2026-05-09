# 高级GLSL

我们将会讨论一些有趣的**内建变量**(Built-in Variable)，管理着色器输入和输出的新方式以及一个叫做**Uniform缓冲对象**(Uniform Buffer Object)的有用工具。

# GLSL的内建变量

- 啥是内建变量

  在编写GLSL代码时，可以使用已经声明好了的变量就称为：内建变量，可供我们直接赋值使用。
  
- 例子

  之前章节中遇到的：顶点着色器的输出向量**gl_Position**，和片段着色器的**gl_FragCoord**。

## 在顶点着色器的内建变量

### gl_PointSize

- 简介

  - 每一个顶点都是一个图元，都会被渲染为一个点。

  - 可以通过OpenGL的**glPointSize**函数来设置渲染出来的**点的大小**，但我们也可以在顶点着色器中修改这个值。
  - GLSL定义了一个叫做gl_PointSize**输出**变量，它是一个float变量，你可以使用它来设置点的宽高（像素）。在顶点着色器中修改点的大小的话，你就能对每个顶点设置不同的值了。

- 如何启用

  默认是禁用的,启用OpenGL的GL_PROGRAM_POINT_SIZE：

  ```cpp
  glEnable(GL_PROGRAM_POINT_SIZE);
  ```

- 使用例子

  将点的大小设置为**裁剪空间**位置的z值，也就是顶点距观察者的距离。**点**的大小会随着观察者距顶点距离变远而**增大**。

  ```cpp
  void main()
  {
      gl_Position = projection * view * model * vec4(aPos, 1.0);    
      gl_PointSize = gl_Position.z;    
  }
  ```

  ![](图片/4.7高级glsl/advanced_glsl_pointsize.png)

  对每个顶点使用不同的点大小，会在粒子生成之类的技术中很有意思

### gl_VertexID

- 简介

  - 整型变量gl_VertexID储存了正在绘制顶点的当前**ID**。

  - 只能对它进行**读取**
  - 当（使用glDrawElements）进行**索引**渲染的时候，这个变量会存储正在绘制顶点的**当前索引**。
  - 当（使用glDrawArrays）不使用索引进行绘制的时候，这个变量会储存从渲染调用开始的已处理**顶点数量**。

## 在片段着色器的内建变量

### gl_FragCoord

- 简介

  - gl_FragCoord是输入变量，能让我们读取当前片段的**窗口空间坐标**，并获取它的深度值

  - gl_FragCoord的**z**分量等于对应片段的**深度值**。
  - gl_FragCoord的x和y分量是**片段**的窗口空间(Window-space)**坐标**，其原点为窗口的**左**下角。

- 例子

  通过利用片段着色器的gl_FragCoord，我们可以根据片段的窗口坐标，计算出不同的颜色。

  我们能够将屏幕分成两部分，在窗口的**左侧**渲染一种输出，在窗口的**右侧**渲染另一种输出。

  ```cpp
  void main()
  {             
      if(gl_FragCoord.x < 400)
          FragColor = vec4(1.0, 0.0, 0.0, 1.0);// 红色
      else
          FragColor = vec4(0.0, 1.0, 0.0, 1.0);// 绿色  
  }
  ```

  ![](图片/4.7高级glsl/advanced_glsl_fragcoord.png)

### gl_FrontFacing

- 简介

  - gl_FrontFacing是输入变量

  - 前置知识

    OpenGL能够根据顶点的环绕顺序来决定一个面是**正向**还是**背向面**。

  - gl_FrontFacing作用

    如果我们**不使用面剔除**（不启用GL_FACE_CULL），那么gl_FrontFacing将会告诉我们当前片段是属于**正向面**的一部分还是**背向面**的**一部分**。

- 例子

  我们可以这样子创建一个立方体，在内部和外部使用不同的纹理

  ```cpp
  #version 330 core
  out vec4 FragColor;
  
  in vec2 TexCoords;
  
  uniform sampler2D frontTexture;
  uniform sampler2D backTexture;
  
  void main()
  {             
      if(gl_FrontFacing)
          FragColor = texture(frontTexture, TexCoords);// 正向
      else
          FragColor = texture(backTexture, TexCoords);// 背向
  }
  ```

  ![](图片/4.7高级glsl/advanced_glsl_frontfacing.png)

  注意，如果你开启了面剔除，你就看不到箱子内部的面了，所以现在再使用gl_FrontFacing就没有意义了。

### gl_FragDepth

- 简介
  - 前面介绍的：gl_FragCoord
  
    是输入变量，能让我们读取当前片段的窗口空间坐标，并获取它的深度值，但是它是一个**只读**(Read-only)变量。
  
    我们不能修改片段的窗口空间坐标，所以修改片段的深度值需要用到目前介绍的gl_FragDepth。
  
  - gl_FragDepth
  
    是输出变量，我们可以使用它来在着色器内设置片段的**深度值**
  
- 例子

  ```cpp
  gl_FragDepth = 0.0; // 这个片段现在的深度值为 0.0
  ```

  如果片段着色器没有写入值到**gl_FragDepth**，它会自动取用`gl_FragCoord.z`的值。

- 缺陷

  - 只要我们在片段着色器中对gl_FragDepth进行**写入**，OpenGL就会（像[深度测试]()小节中讨论的那样）**禁用**所有的**提前深度测试**(Early Depth Testing)。

    提前深度测试是：

    - 硬件属性
    - 提前深度测试允许深度测试在**片段着色器之前**运行
    - 即：在运行片段着色器时会根据深度测试， 是**舍弃**当前片段还是**运行**片段着色器程序渲染这个片段

  - 它被禁用的原因是

    OpenGL无法在片段着色器运行**之前**得知片段将拥有的深度值，因为片段着色器可能会完全修改这个深度值。

- 解决缺陷

  从OpenGL 4.2起，我们仍可以对两者（写入gl_FragDepth 与 提前深度测试）进行一定的调和。

  方法：在片段着色器的顶部使用深度条件(Depth Condition)重新声明gl_FragDepth变量：

  ```cpp
  layout (depth_<condition>) out float gl_FragDepth;
  ```

  `condition`可以为下面的值：

  | 条件        | 描述                                                         |
  | :---------- | :----------------------------------------------------------- |
  | `any`       | 默认值。提前深度测试是禁用的，你会损失很多性能               |
  | `greater`   | 你只能让深度值比`gl_FragCoord.z`更大                         |
  | `less`      | 你只能让深度值比`gl_FragCoord.z`更小                         |
  | `unchanged` | 如果你要写入`gl_FragDepth`，你将只能写入`gl_FragCoord.z`的值 |

  通过将深度条件设置为`greater`或者`less`，OpenGL就能假设你**只会**写入比当前片段深度值**更大**或者**更小**的值了。这样子的话，当深度值比片段的深度值要小的时候，OpenGL仍是能够进行提前深度测试的。

  - 个人理解（可能有误）

    - 声明写入gl_FragDepth的值只能更大

      写入gl_FragDepth后
    
      当前渲染的片段深度值铁定**大于**深度缓冲中的深度值，不管放到多大，当前片段一定**会**被丢弃，**可**依旧进行提前深度测试
    
    - 声明写入gl_FragDepth的值只能更小
      
      写入gl_FragDepth后：
      
      当前渲染的片段深度值铁定**小于**深度缓冲中的深度值，不管放到多小，当前片段一定**不会**被丢弃，**可**依旧进行提前深度测试

- 解决缺陷例子

  ```cpp
  #version 420 core // 注意GLSL的版本！
  out vec4 FragColor;
  layout (depth_greater) out float gl_FragDepth;// 只会更大
  
  void main()
  {             
      FragColor = vec4(1.0);
      // 当前渲染的片段深度值铁定**大于**深度缓冲中的深度值,所以能提前深度测试
      gl_FragDepth = gl_FragCoord.z + 0.1;
  }  
  ```

# 接口块

- 简介

  作用：方便我们组合顶点着色器传入到片段着色器的这些输入/输出变量。（顶点位置、法线等顶点属性）

- 例子说明什么是接口块

  - 输出

    ```cpp
    #version 330 core
    layout (location = 0) in vec3 aPos;
    layout (location = 1) in vec2 aTexCoords;
    
    uniform mat4 model;
    uniform mat4 view;
    uniform mat4 projection;
    // 注意这里，out说明是输出块
    out VS_OUT// VS_OUT(大写)是块名
    {
        vec2 TexCoords;
    } vs_out;// vs_out(小写)是实例名
    
    void main()
    {
        gl_Position = projection * view * model * vec4(aPos, 1.0);    
        vs_out.TexCoords = aTexCoords;
    }  
    ```

  - 输入

    ```cpp
    #version 330 core
    out vec4 FragColor;
    // 注意这里，in说明是输入块
    in VS_OUT// VS_OUT(大写)是块名
    {
        vec2 TexCoords;
    } fs_in;// fs_in(小写)是实例名
    
    uniform sampler2D texture;
    
    void main()
    {             
        FragColor = texture(texture, fs_in.TexCoords);   
    }
    ```
  
    - **块名**：VS_OUT
    
      顶点着色器与片段着色器的块名一致
    
    - 实例名：
    
      顶点着色器：vs_out
    
      片段着色器：fs_in
    
    只要两个**接口块的名字**一样，它们对应的输入和输出将会匹配起来。

# Uniform缓冲对象

- 之前使用Uniform缺陷

  当使用**多于**一个的着色器时，尽管大部分的uniform变量都是相同的，我们还是需要不断地设置它们。

  - 具体说明

    比如一个场景有正方体、原体，他们两个用了**两**个着色器分别渲染，这两个着色器都有一个uniform mat4 project属性，代表都需要一个摄像机的投影矩阵，这样渲染前两个着色器分别需要设置上传一次这个project uniform，共**两**次。

- 使用Uniform**缓冲**对象

  允许我们定义一系列在多个着色器中相同的**全局**Uniform变量。

  当使用Uniform**缓冲对象**的时候，我们只需要设置相关的uniform**一次**。

  tips：可以类别为编程语言中类中的**普通变量**和**static变量**。

- 例子

  glsl

  ```cpp
  #version 330 core
  layout (location = 0) in vec3 aPos;
  
  // Uniform缓冲对象
  layout (std140) uniform Matrices
  {
      mat4 projection;
      mat4 view;
  };
  
  uniform mat4 model;
  
  void main()
  {
      gl_Position = projection * view * model * vec4(aPos, 1.0);
  }
  ```
  

## Uniform块布局

- 引出：什么是Uniform块布局

  - Uniform块的**内容**是储存在一个缓冲对象中的，它实际上只是一块预留内存

    如上一节的

    ```cpp
    layout (std140) uniform Matrices
    {
        mat4 projection;
        mat4 view;
    };
    ```

    这是一个Uniform块声明，但是不具有**内容**

    - mat4 projection;

      预留了一个4x4float数组大小的内存

    - mat4 view;

      预留了一个4x4float数组大小的内存

  - 需要指定内容

    因为这块内存并不会保存它具体保存的是什么类型的数据，我们还需要告诉OpenGL在内存的哪一部分**对应**着着色器中的哪一个uniform变量（即哪块内存数据是给projection、哪块内存数据是给view）。
    
    如何告诉，这就是**Uniform块布局**。
    
    （可以类比之前：glVertexAttribPointer，来指定内存数组的顶点输入数据的哪一个部分对应**顶点着色器**的**哪一个顶点属性**）

- 假设着色器中有以下的这个Uniform块：

  ```cpp
  layout (std140) uniform ExampleBlock
  {
      float value;
      vec3  vector;
      mat4  matrix;
      float values[3];
      bool  boolean;
      int   integer;
  };
  ```

  我们需要知道的是每个变量的**大小**（字节）和（从块起始位置的）**偏移量**，来让我们能够按顺序将它们放进缓冲中。

  - 每个元素的大小都是在OpenGL中有清楚地声明的，而且直接对应C++数据类型，其中向量和矩阵都是float数组。
  - OpenGL没有声明的是这些变量间的**间距**(Spacing)

- 前置了解：硬件自动偏移量与共享布局

  - 硬件自动定义了偏移量，GLSL会使用一个叫做**共享**(Shared)布局的Uniform内存布局

  - 使用共享布局时，GLSL是可以为了优化而对uniform变量的**位置**进行变动的，只要变量的**相对顺序**保持不变。

  - 能够使用像是**glGetUniformIndices**这样的函数来查询每个uniform变量的偏移量，从而计算获取这个uniform的位置进行上传数据。

    小结：glsl会改变uniform的位置，则需要使用glGetUniformIndices函数查询uniform的偏移量，这会产生非常多的工作量。

- std140布局

  克服：硬件自动偏移量与共享布局的缺陷

  - 简介
  
    - std140布局声明了每个变量的偏移量都是由一系列规则所决定的，这**显式地**声明了每个变量类型的内存布局。由于这是显式提及的，我们可以手动计算出每个变量的偏移量。
    - **基准对齐量**，它等于一个变量在Uniform块中所占据的空间（包括填充量(Padding)），这个基准对齐量是使用std140布局的规则计算出来的。（类型的大小，float：4、）
    - **对齐偏移量**，它是一个变量从块**起始位置**的字节偏移量。
    - 一个变量的对齐字节偏移量**必须**等于基准对齐量的倍数。

  - 布局规则

    GLSL中的每个变量，比如说int、float和bool，都被定义为4字节量。每4个字节将会用一个`N`来表示。
  
    | 类型                | 布局规则                                                     |
    | :------------------ | :----------------------------------------------------------- |
    | 标量，比如int和bool | 每个标量的基准对齐量为N。                                    |
    | 向量                | 2N或者4N。这意味着vec3的基准对齐量为4N。                     |
    | 标量或向量的数组    | 每个元素的基准对齐量与vec4的相同。                           |
    | 矩阵                | 储存为列向量的数组，每个向量的基准对齐量与vec4的相同。       |
    | 结构体              | 等于所有元素根据规则计算后的大小，但会填充到vec4大小的倍数。 |

  - 例子
  
    ```cpp
    layout (std140) uniform ExampleBlock
    {
                         // 基准对齐量       // 对齐偏移量
        float value;     // 4               // 0 
        vec3 vector;     // 16              // 16  (必须是16的倍数，所以 4->16)
        mat4 matrix;     // 16              // 32  (列 0)
                         // 16              // 48  (列 1)
                         // 16              // 64  (列 2)
                         // 16              // 80  (列 3)
        float values[3]; // 16              // 96  (values[0])
                         // 16              // 112 (values[1])
                         // 16              // 128 (values[2])
        bool boolean;    // 4               // 144
        int integer;     // 4               // 148
    }; 
    ```
  
    - 如vec3 vector;
    
      由于：一个变量的对齐字节偏移量**必须**等于基准对齐量的倍数
    
      本来：它的对齐偏移量是4的，但是它的基准对齐量是16，所以4需要向上增长到16为基准对齐量（16）的一倍
    
    通过在Uniform块定义之前添加`layout (std140)`语句，我们告诉OpenGL这个Uniform块使用的是std140布局。

## 使用Uniform缓冲

### 简介

我们已经讨论了如何在着色器中定义Uniform块，并设定它们的内存布局了，但我们还没有讨论该如何使用它们。

### 绑定点

![](图片/4.7高级glsl/advanced_glsl_binding_points.png)

在OpenGL上下文中，定义了一些**绑定点**(Binding Point)，我们可以将一个**Uniform缓冲**（图中的右边）链接至它。

在创建Uniform缓冲之后，我们将它绑定到其中一个绑定点上，并将着色器中的**Uniform块**（图中的左边）绑定到相同的绑定点，把它们连接到一起。

- 将**Uniform块**绑定到一个特定的绑定点中

  ```cpp
  // 将shaderA中的Lights Uniform块的索引点链接为绑定点的2号索引上
  unsigned int lights_index = glGetUniformBlockIndex(shaderA.ID, "Lights");   
  glUniformBlockBinding(shaderA.ID, lights_index, 2);
  ```

  - glGetUniformBlockIndex

    用来获取**Uniform块索引**(Uniform Block Index)，是着色器中已定义Uniform块的**位置值索引**。

    接受一个**着色器程序对象**和**Uniform块的名称**

  - glGetUniformBlockIndex

    - 第一个参数是一个着色器程序对象

    - 第二个参数是一个**Uniform块索引**和链接到的绑定点

  ```cpp
  /*从OpenGL 4.2版本起，你也可以添加一个布局标识符，显式地将Uniform块的绑定点储存在着色器中，这样就不用再调用glGetUniformBlockIndex和glUniformBlockBinding了。下面的代码显式地设置了Lights Uniform块的绑定点。*/
  layout(std140, binding = 2) uniform Lights { ... };
  ```

- 绑定**Uniform缓冲对象**到相同的绑定点上

  ```cpp
  // 将uboExampleBlock缓冲链接为绑定点的2号索引上
  glBindBufferBase(GL_UNIFORM_BUFFER, 2, uboExampleBlock); 
  // 或
  glBindBufferRange(GL_UNIFORM_BUFFER, 2, uboExampleBlock, 0, 152);
  ```

  - glBindbufferBase

    一个绑定点**索引**和一个Uniform**缓冲对象**作为它的参数

  - glBindBufferRange

    - 除了绑定点**索引**与Uniform**缓冲对象**，还需要一个附加的**偏移量**和大小参数
    - 这样子你可以绑定Uniform缓冲的特定**一部分**到绑定点中。
    - 可以让**多个不同**的Uniform块绑定到**同一个**Uniform缓冲对象上

- 向Uniform缓冲中添加数据

  glBufferSubData函数，用一个字节数组添加所有的数据，或者更新缓冲的一部分。

  ```cpp
  glBindBuffer(GL_UNIFORM_BUFFER, uboExampleBlock);
  int b = true; // GLSL中的bool是4字节的，所以我们将它存为一个integer
  // 将缓冲的144字节开始的4个字节填充为b 
  glBufferSubData(GL_UNIFORM_BUFFER, 144, 4, &b);
  glBindBuffer(GL_UNIFORM_BUFFER, 0);
  ```

  对应的Uniform块，缓冲的144是boolean的**对齐**偏移量，4是boolean的**基准**对齐量

  ```cpp
  layout (std140) uniform ExampleBlock
  {
                       // 基准对齐量       // 对齐偏移量
  	.....
      float values[3]; // 16              // 96  (values[0])
                       // 16              // 112 (values[1])
                       // 16              // 128 (values[2])
      bool boolean;    // 4               // 144
      .....
  }; 
  ```

### 例子

- glsl

  ```cpp
  #version 330 core
  layout (location = 0) in vec3 aPos;
  
  layout (std140) uniform Matrices
  {
      mat4 projection;
      mat4 view;
  };
  uniform mat4 model;
  
  void main()
  {
      gl_Position = projection * view * model * vec4(aPos, 1.0);
  }
  ```

- 首先，我们将四个顶点着色器的**Uniform块**设置为绑定点0

  这4个着色器程序对象都使用这个顶点着色器，都各自具有一个uniform块，都链接到绑定点0号

  ```cpp
  unsigned int uniformBlockIndexRed    = glGetUniformBlockIndex(shaderRed.ID, "Matrices");
  unsigned int uniformBlockIndexGreen  = glGetUniformBlockIndex(shaderGreen.ID, "Matrices");
  unsigned int uniformBlockIndexBlue   = glGetUniformBlockIndex(shaderBlue.ID, "Matrices");
  unsigned int uniformBlockIndexYellow = glGetUniformBlockIndex(shaderYellow.ID, "Matrices");  
  
  glUniformBlockBinding(shaderRed.ID,    uniformBlockIndexRed, 0);
  glUniformBlockBinding(shaderGreen.ID,  uniformBlockIndexGreen, 0);
  glUniformBlockBinding(shaderBlue.ID,   uniformBlockIndexBlue, 0);
  glUniformBlockBinding(shaderYellow.ID, uniformBlockIndexYellow, 0);
  ```

- 我们创建Uniform缓冲对象本身

  ```cpp
  unsigned int uboMatrices
  glGenBuffers(1, &uboMatrices);
  
  glBindBuffer(GL_UNIFORM_BUFFER, uboMatrices);
  glBufferData(GL_UNIFORM_BUFFER, 2 * sizeof(glm::mat4), NULL, GL_STATIC_DRAW);
  glBindBuffer(GL_UNIFORM_BUFFER, 0);
  
  glBindBufferRange(GL_UNIFORM_BUFFER, 0, uboMatrices, 0, 2 * sizeof(glm::mat4));
  ```

  首先我们为缓冲分配了足够的内存，它等于glm::mat4大小的两倍。GLM矩阵类型的大小**直接对应**于GLSL中的mat4。接下来，我们将缓冲中的特定范围（在这里是整个缓冲）链接到**绑定点0**。

  **四**个Uniform**块**对应**一**个Uniform**缓冲**

- 填充这个缓冲

  ```cpp
  glm::mat4 projection = glm::perspective(glm::radians(45.0f), (float)width/(float)height, 0.1f, 100.0f);
  glBindBuffer(GL_UNIFORM_BUFFER, uboMatrices);
  // 向Uniform缓冲中添加数据，0位置开始，1个mat4大小，代表前个部分
  glBufferSubData(GL_UNIFORM_BUFFER, 0, sizeof(glm::mat4), glm::value_ptr(projection));
  glBindBuffer(GL_UNIFORM_BUFFER, 0);
  ```

  这里我们将**投影矩阵**储存在Uniform缓冲的前半部分。

  我们会将**观察矩阵**更新到缓冲的后半部分：

  ```cpp
  glm::mat4 view = camera.GetViewMatrix();           
  glBindBuffer(GL_UNIFORM_BUFFER, uboMatrices);
  // 向Uniform缓冲中添加数据，1个mat4大小起始位置，1个mat4大小，代表后半部分
  glBufferSubData(GL_UNIFORM_BUFFER, sizeof(glm::mat4), sizeof(glm::mat4), glm::value_ptr(view));
  glBindBuffer(GL_UNIFORM_BUFFER, 0);
  ```

  只需要设置**一次**

- 现在要用4个不同的着色器绘制4个立方体，它们的投影和观察矩阵都会是一样的。

  ```cpp
  glBindVertexArray(cubeVAO);
  shaderRed.use();
  glm::mat4 model;
  model = glm::translate(model, glm::vec3(-0.75f, 0.75f, 0.0f));  // 移动到左上角
  shaderRed.setMat4("model", model);
  glDrawArrays(GL_TRIANGLES, 0, 36);        
  // ... 绘制绿色立方体
  // ... 绘制蓝色立方体
  // ... 绘制黄色立方体 
  ```

  唯一需要设置的uniform只剩model uniform了。在像这样的场景中使用Uniform缓冲对象会让我们在每个着色器中都剩下一些uniform调用。最终的结果会是这样的：

- 效果

  ![](图片/4.7高级glsl/advanced_glsl_uniform_buffer_objects.png)

## Uniform缓冲对象比Uniform的优点

- 一次设置很多uniform会比一个一个设置多个uniform要快很多。
- 比起在多个着色器中修改同样的uniform，在Uniform缓冲中修改一次会更容易一些。
- 你可以在着色器中使用更多的uniform。OpenGL限制了它能够处理的**uniform**数量，这可以通过GL_MAX_VERTEX_UNIFORM_COMPONENTS来查询。
