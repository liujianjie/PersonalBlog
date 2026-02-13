# 网格

- 自定义网格类

  通过使用Assimp，我们可以加载不同的**模型**到程序中，但是载入后它们都被储存为Assimp的数据结构。

  为了**渲染**这个模型/物体，我们需要将这些数据转换为OpenGL能够理解的格式，所以需要自定义网格类来**读取**存储在Assimp数据结构中的模型数据。

- 思考自定义网格类的属性

  - 一个网格应该至少需要一系列的顶点，每个顶点包含一个**位置**向量、一个**法**向量和一个**纹理坐标**向量
  - 一个网格还应该包含用于索引绘制的**索引**以及纹理形式的**材质**数据（漫反射/镜面光贴图）。

  ```cpp
  struct Vertex {
      glm::vec3 Position;
      glm::vec3 Normal;
      glm::vec2 TexCoords;
  };
  struct Texture {
      unsigned int id;
      string type;
  };
  ```

# 自定义Mesh类重点代码讲解

## 初始化函数

- 代码

  ```cpp
  void setupMesh()
  {
      glGenVertexArrays(1, &VAO);
      glGenBuffers(1, &VBO);
      glGenBuffers(1, &EBO);
  
      glBindVertexArray(VAO);
      glBindBuffer(GL_ARRAY_BUFFER, VBO);
  
      glBufferData(GL_ARRAY_BUFFER, vertices.size() * sizeof(Vertex), &vertices[0], GL_STATIC_DRAW);  
  
      glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, EBO);
      glBufferData(GL_ELEMENT_ARRAY_BUFFER, indices.size() * sizeof(unsigned int), 
                   &indices[0], GL_STATIC_DRAW);
  
      // 顶点位置
      glEnableVertexAttribArray(0);   
      glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void*)0);
      // 顶点法线
      glEnableVertexAttribArray(1);   
      glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void*)offsetof(Vertex, Normal));
      // 顶点纹理坐标
      glEnableVertexAttribArray(2);   
      glVertexAttribPointer(2, 2, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void*)offsetof(Vertex, TexCoords));
  
      glBindVertexArray(0);
  }  
  ```

- 说明

  - sizeof(Vertex);能得到结构体的大小

    因为

    C++结构体有一个很棒的特性，它们的内存布局是**连续**的(Sequential)。

    将结构体作为一个数据数组使用，那么它将会以**顺序排列**结构体的变量，这将会直接转换为我们在数组缓冲中所需要的float（实际上是字节）数组

    ```c++
    Vertex vertex;
    vertex.Position  = glm::vec3(0.2f, 0.4f, 0.6f);
    vertex.Normal    = glm::vec3(0.0f, 1.0f, 0.0f);
    vertex.TexCoords = glm::vec2(1.0f, 0.0f);
    // = [0.2f, 0.4f, 0.6f, 0.0f, 1.0f, 0.0f, 1.0f, 0.0f];
    ```

    sizeof(Vertex); 32字节（8个float * 每个4字节）

  - 结构体的另外一个很好的用途是它的预处理指令`offsetof(s, m)`

    - 它的第一个参数是一个**结构体**，第二个参数是这个结构体中**变量的名**字。这个宏会返回那个变量距结构体头部的字节**偏移量**(Byte Offset)

    - 这正好可以用在定义glVertexAttribPointer函数中的偏移参数：

      ```cpp
      glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void*)offsetof(Vertex, Normal)); 
      ```

      偏移量现在是使用**offsetof**来定义

      这里它会将法向量的字节偏移量设置为结构体中法向量的偏移量，也就是3个float，即12字节。

## 渲染函数

- 问题引入

  真正渲染这个网格之前，我们需要在调用glDrawElements函数之前先绑定相应的**纹理**

  我们一开始并不知道这个网格（如果有的话）有多少纹理、纹理是什么类型的。

- 如何解决

  设定一个shader纹理采样命名标准：

  每个漫反射纹理被命名为`texture_diffuseN`，每个镜面光纹理应该被命名为`texture_specularN`，其中`N`的范围是1到纹理采样器最大允许的数字

  ```cpp
  uniform sampler2D texture_diffuse1;
  uniform sampler2D texture_diffuse2;
  uniform sampler2D texture_diffuse3;
  uniform sampler2D texture_specular1;
  uniform sampler2D texture_specular2;
  ```

  需要预先在shader中定义那么多纹理采样名称，可能会有所**浪费**或者**不够**的问题

  - 浪费

    网格只有**两**个纹理，而shader预定义了**4**个uniform名称

  - 不够（这个问题可能不会出现）

    网格有**34**个纹理，而shader只能根据opengl最大预定义**32**个

- 代码

  ```cpp
  void Draw(Shader shader) 
  {
      unsigned int diffuseNr = 1;
      unsigned int specularNr = 1;
      for(unsigned int i = 0; i < textures.size(); i++)
      {
          glActiveTexture(GL_TEXTURE0 + i); // 在绑定之前激活相应的纹理单元
          // 获取纹理序号（diffuse_textureN 中的 N）
          string number;
          string name = textures[i].type;
          if(name == "texture_diffuse")
              number = std::to_string(diffuseNr++);
          else if(name == "texture_specular")
              number = std::to_string(specularNr++);
  
          shader.setInt(("material." + name + number).c_str(), i);
          glBindTexture(GL_TEXTURE_2D, textures[i].id);
      }
      glActiveTexture(GL_TEXTURE0);
  
      // 绘制网格
      glBindVertexArray(VAO);
      glDrawElements(GL_TRIANGLES, indices.size(), GL_UNSIGNED_INT, 0);
      glBindVertexArray(0);
  }
  ```

  
