> 本人刚学OpenGL不久且自学，文中定有代码、术语等错误，欢迎指正

我写的项目地址：[https://github.com/liujianjie/LearnOpenGLProject](https://github.com/liujianjie/LearnOpenGLProject)

LearnOpenGL中文官网：[https://learnopengl-cn.github.io/](https://learnopengl-cn.github.io/)


[toc]

  > 此节简要记些比较重要的基础数学背景，更完整内容请看LearnOpenGL官网。

  # 变换

  有两种方式改变物体的位置

  - 在每一帧改变物体的顶点并且重配置缓冲区从而使它们移动
  - 使用（多个）矩阵(Matrix)对象可以更好的变换(Transform)一个物体

  # 向量

  ## 单位向量

  - 特殊性质：它的长度是1

  - 单位向量计算方法

    为它每个分量**除以**向量的**长度**得到它的单位向量

  - 例子

    （4,2）它的长度是√20

    那么**单位向量**是：（（4/√20），（2/√20））

    单位向量的**长度**是：√(（4/√20）\*（4/√20）+（2/√20）\*（2/√20）) = 1


  ## 向量点乘

  - 公式

    ![](https://raw.githubusercontent.com/liujianjie/Image/main/CSDNBlogImg/202302281048940.png)

    v*k=v的长度\*k的长度\*cos(v与k的夹角)

    - 正交，夹角90度

      v*k点积为0

  - 点乘的值v*k

    ![](https://raw.githubusercontent.com/liujianjie/Image/main/CSDNBlogImg/202302281049317.png)

    - 由点乘值算两向量的夹角

      用反余弦函数arccos(-0.8) = 143.1度

  - 算夹角

    计算两个单位向量间的夹角，我们可以使用反余弦函数cos−1，可得结果是143.1度。

    现在我们很快就计算出了这两个向量的夹角。

    点乘会在计算光照的时候非常有用。

  ## 向量叉乘

  - 公式

    ![](https://raw.githubusercontent.com/liujianjie/Image/main/CSDNBlogImg/202302281049528.png)

  - 竖着摆更直观

    ![](https://raw.githubusercontent.com/liujianjie/Image/main/CSDNBlogImg/202302281048011.png)

  - 结果是

    得到一个正交于两个输入向量的第三个向量

    ![](https://raw.githubusercontent.com/liujianjie/Image/main/CSDNBlogImg/202302281049446.png)

  

  # 矩阵

  ## 矩阵的缩放

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/CSDNBlogImg/202302281048090.png)

  ## 矩阵的平移

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/CSDNBlogImg/202302281050348.png)

  ## 矩阵的旋转

  最麻烦的

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/CSDNBlogImg/202302281048013.png)

  用矩阵来旋转变换，会导致万向锁，需要用四元数。

  ## 矩阵的组合

  - 记住顺序-下面有glm例子

    - 写代码的顺序

      **平移矩阵\*旋转矩阵\*缩放矩阵*向量**

    - 解读的顺序

      从右往左读，向量先进行缩放，再进行旋转最后平移

  - 例子

    ![](https://raw.githubusercontent.com/liujianjie/Image/main/CSDNBlogImg/202302281048024.png)

    ![](https://raw.githubusercontent.com/liujianjie/Image/main/CSDNBlogImg/202302281050164.png)

  - 注意

    - 当矩阵相乘时，在**最右边**的矩阵是第一个与向量相乘的，所以应该从右向左读这个乘法

    - 如果代码是：缩放矩阵\*旋转矩阵*平移矩阵

      解读时是先平移再旋转、缩放，可能会造成消极地影响。

      比如，如果先位移再缩放，位移的向量也会同样被缩放。

      从2x+1，变成（1+x）*2

      若x=1，2x+1=3，（1+x)*2=4

  # GLM

  ## 集成到项目中

  - 网站下载

    https://github.com/g-truc/glm

    不需要编译成lib文件

  - 如何集成glm

    复制文件夹到项目下

    ![](https://raw.githubusercontent.com/liujianjie/Image/main/CSDNBlogImg/202302281048048.png)

    包含这个目录

    ![](https://raw.githubusercontent.com/liujianjie/Image/main/CSDNBlogImg/202302281050622.png)

  ## 例子

  - 代码

    glsl

    ```cpp
    #version 330 core
    layout (location = 0) in vec3 aPos;
    layout (location = 1) in vec3 aColor;
    layout (location = 2) in vec2 aTexCoord;
    
    out vec3 ourColor;
    out vec2 TexCoord;
    
    uniform mat4 transform;
    
    void main()
    {
        // 矩阵变换顶点：将一个物体的每个顶点都变换到新位置，从而实现移动一个物体
        gl_Position = transform * vec4(aPos, 1.0);
        ourColor = aColor;
        TexCoord = aTexCoord;
    }
    ```

    ```cpp
    #version 330 core
    out vec4 FragColor;
    
    in vec3 ourColor;
    in vec2 TexCoord;
    
    uniform sampler2D texture1;
    uniform sampler2D texture2;
    
    void main()
    {
        // 两纹理混合
        FragColor = mix(texture(texture1, TexCoord), texture(texture2, TexCoord), 0.2);
        // 单个纹理与颜色混合
        //FragColor = texture(texture1, TexCoord) * vec4(ourColor, 1.0);
    }
    ```

    cpp

    ```cpp
    #include <glm/glm.hpp>
    #include <glm/gtc/matrix_transform.hpp>
    #include <glm/gtc/type_ptr.hpp>
    .....
    while (!glfwWindowShouldClose(window))
    {
        // 变换
        glm::mat4 trans = glm::mat4(1.0f);
        trans = glm::translate(trans, glm::vec3(0.5, -0.5, 0.0));
        trans = glm::rotate(trans, (float)glfwGetTime(), glm::vec3(0.0, 0.0, 1.0));
        trans = glm::scale(trans, glm::vec3(0.5, 0.5, 0.5));
        // 发送数据给uniform
        unsigned int transformLoc = glGetUniformLocation(ourShader.ID, "transform");
        glUniformMatrix4fv(transformLoc, 1, GL_FALSE, glm::value_ptr(trans));
    .....
    ```

    - 顺序：

      代码顺序：平移矩阵\*旋转矩阵\*缩放矩阵*向量

      阅读效果顺序：把箱子在每个轴都缩放到0.5倍，然后沿z轴根据时间旋转度数，并平移到(0.5, -0.5, 0)位置

  - 效果

    ![](https://raw.githubusercontent.com/liujianjie/Image/main/CSDNBlogImg/202302281050148.png)

    ![](https://raw.githubusercontent.com/liujianjie/Image/main/CSDNBlogImg/202302281048052.png)