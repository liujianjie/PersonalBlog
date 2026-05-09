# 高级数据

就是介绍除了前面介绍的glBufferData以为，还有其它API可以填充缓冲数据

- 介绍的API小结

  - glBufferSubData

  - glMapBuffer得到指针

    memcpy();// 复制数据到内存

  - glCopyBufferSubData

## glMapBuffer

### 简单说明：以填充缓冲数据说明

- **之前**填充缓冲数据

  ```cpp
  glBufferData(GL_ARRAY_BUFFER, sizeof(cubeVertices), &cubeVertices, GL_STATIC_DRAW);
  ```

- **现在**请求缓冲内存的指针，直接将数据复制到缓冲当中

  ```cpp
  float data[] = {
    0.5f, 1.0f, -0.35f
    ...
  };
  glBindBuffer(GL_ARRAY_BUFFER, buffer);
  // 返回当前绑定缓冲的内存指针
  void *ptr = glMapBuffer(GL_ARRAY_BUFFER, GL_WRITE_ONLY);
  // 复制数据到内存
  memcpy(ptr, data, sizeof(data));
  // 记得告诉OpenGL我们不再需要这个指针了
  glUnmapBuffer(GL_ARRAY_BUFFER);
  ```

## glBufferSubData

### 简单说明：以填充缓冲数据为例

- **之前**填充缓冲数据

  ```cpp
  glBufferData(GL_ARRAY_BUFFER, sizeof(cubeVertices), &cubeVertices, GL_STATIC_DRAW);
  ```

- **现在**分两步

  - 分配内存，但不进行填充。在这我们需要**预留**(Reserve)特定大小的内存

    ```cpp
    // sizeof(cubeVertices)与null是关键
    glBufferData(GL_ARRAY_BUFFER, sizeof(cubeVertices), null, GL_STATIC_DRAW);
    ```
  
  - 使用glBufferSubData，填充缓冲的特定区域
  
    ```cpp
    glBufferSubData(GL_ARRAY_BUFFER,  0, sizeof(data), &data); // 范围： [ 0,  0 + sizeof(data)]
    glBufferSubData(GL_ARRAY_BUFFER, 24, sizeof(data), &data); // 范围： [24, 24 + sizeof(data)]
    ```

### 实际使用：分批顶点属性

- **之前**指定顶点数组缓冲内容的**属性布局**

  顶点属性数据（顶点位置、法线）在一个数组中

  ```cpp
  float cubeVertices[] = {
      // vertices, normal
      -0.5f, -0.5f, -0.5f,  0.0f,  0.0f, -1.0f,
      ......
  };
  // cube VAO
  unsigned int cubeVAO, cubeVBO;
  glGenVertexArrays(1, &cubeVAO);
  glGenBuffers(1, &cubeVBO);
  glBindVertexArray(cubeVAO);
  glBindBuffer(GL_ARRAY_BUFFER, cubeVBO);
  // 填充缓冲数据
  glBufferData(GL_ARRAY_BUFFER, sizeof(cubeVertices), &cubeVertices, GL_STATIC_DRAW);
  
  // 顶点属性指针
  glEnableVertexAttribArray(0);
  glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 6 * sizeof(float), (void*)0);
  glEnableVertexAttribArray(1);
  glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, 6 * sizeof(float), (void*)(3 * sizeof(float)));
  glBindVertexArray(0);
  ```

- **现在**

  顶点属性数据可以在**多**个数组中
  
  ```cpp
  float positions[] = { ... };// 顶点位置一个数组
  float normals[] = { ... };	// 法线一个数组
  float tex[] = { ... };		// UV一个数组
  // cube VAO
  unsigned int cubeVAO, cubeVBO;
  glGenVertexArrays(1, &cubeVAO);
  glGenBuffers(1, &cubeVBO);
  glBindVertexArray(cubeVAO);
  glBindBuffer(GL_ARRAY_BUFFER, cubeVBO);
  // 预留大小
  glBufferData(GL_ARRAY_BUFFER, sizeof(positions) + sizeof(normals) + sizeof(tex), null, GL_STATIC_DRAW);
  
  // 填充缓冲数据-用glBufferSubData分批
  glBufferSubData(GL_ARRAY_BUFFER, 0, sizeof(positions), &positions);
  glBufferSubData(GL_ARRAY_BUFFER, sizeof(positions), sizeof(normals), &normals);
  glBufferSubData(GL_ARRAY_BUFFER, sizeof(positions) + sizeof(normals), sizeof(tex), &tex);
  
  // 顶点属性指针
  glEnableVertexAttribArray(0);
  glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), 0);  
  glEnableVertexAttribArray(1);
  glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)(sizeof(positions))); 
  glEnableVertexAttribArray(2); 
  glVertexAttribPointer(
    2, 2, GL_FLOAT, GL_FALSE, 2 * sizeof(float), (void*)(sizeof(positions) + sizeof(normals)));
  ```
  

## glCopyBufferSubData复制缓冲

- 函数形式

  ```cpp
  void glCopyBufferSubData(GLenum readtarget, GLenum writetarget, GLintptr readoffset, GLintptr writeoffset, GLsizeiptr size);
  ```

  `readtarget`和`writetarget`参数需要填入复制**源**和复制**目标**的缓冲目标。

  比如说，我们可以将VERTEX_ARRAY_BUFFER缓冲**复制**到VERTEX_ELEMENT_ARRAY_BUFFER缓冲，分别将这些缓冲目标设置为**读**和**写**的目标（就是glCopyBufferSubData函数的第一个和第二个参数）。

- 例子1

  ```cpp
  float vertexData[] = { ... };
  glBindBuffer(GL_COPY_READ_BUFFER, vbo1);
  glBindBuffer(GL_COPY_WRITE_BUFFER, vbo2);
  glCopyBufferSubData(GL_COPY_READ_BUFFER, GL_COPY_WRITE_BUFFER, 0, 0, sizeof(vertexData));
  ```

- 例子2

  我们也可以只将`readtarget`（复制源）绑定为最新的缓冲目标类型（就是glCopyBufferSubData函数的第一个参数为**最新的缓冲目标类型**）：

  ```cpp
  float vertexData[] = { ... };
  glBindBuffer(GL_ARRAY_BUFFER, vbo1);// 将vbo1绑定到GL_ARRAY_BUFFER缓冲
  glBindBuffer(GL_COPY_WRITE_BUFFER, vbo2);
  // readtarget=GL_ARRAY_BUFFER，表明最新绑定的缓冲目标类型
  glCopyBufferSubData(GL_ARRAY_BUFFER, GL_COPY_WRITE_BUFFER, 0, 0, sizeof(vertexData));
  ```

  
