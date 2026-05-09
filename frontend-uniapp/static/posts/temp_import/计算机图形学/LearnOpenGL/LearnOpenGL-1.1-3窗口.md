# Cmake

- 用来构建vs工程的

- 如果报error in configuration process错误

  安装的vs2019需要有cmake插件

  ![](图片/1.1窗口/1.cmake所需.png)

# GLFW

用来生成窗口并保存OpenGL上下文

- 下载源代码包

  cmake编译

  打开sln

  编译

  把include和lib放入项目中

  项目设置链接lib

# GLAD

- 相关网站：https://glad.dav1d.de/

  是在线生成使用哪个版本的文件

用来加载OpenGL函数的，这样不用程序员自己手动检测OpenGL函数的地址，可以直接使用GLAD库里声明的OpenGL函数（因检测到了函数的定义位置）。

GLAD是用来管理OpenGL的函数指针的。

```cpp
// glad加载OpenGL函数，glfw提供OpenGL函数指针地址
if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress))
```

- 项目设置
  - include文件夹放入项目下
  - glad.c文件要被包含在项目下

# 工作流程

- GLFW

  - 初始化和配置

  - glfw窗口生成

    设置上下文

    设置窗口大小改变，视口窗口也改变

- GLAD

  - 加载所有OpenGL函数地址

    函数地址由GLFW提供

```cpp
#include <glad/glad.h>
#include <GLFW/glfw3.h>
#include <iostream>
// 按键事件
void processInput(GLFWwindow* window)
{
    if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
        glfwSetWindowShouldClose(window, true);
}
void framebuffer_size_callback(GLFWwindow* window, int width, int height)
{
    glViewport(0, 0, width, height);
}
int main()
{
    glfwInit();
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);// 主版本号(Major) 版本
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);// 次版本号(Minor)
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);// 核心模式(Core-profile)
    //glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, GL_TRUE);

    // 这是窗口
    GLFWwindow* window = glfwCreateWindow(800, 600, "LearnOpenGL", NULL, NULL);
    if (window == NULL)
    {
        std::cout << "Failed to create GLFW window" << std::endl;
        glfwTerminate();
        return -1;
    }
    glfwMakeContextCurrent(window);// 将我们窗口的上下文设置为当前线程的主上下文
    // 设置窗口改变视口也改变
    glfwSetFramebufferSizeCallback(window, framebuffer_size_callback);

    // glad加载OpenGL函数，glfw提供OpenGL函数指针地址
    if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress))
    {
        std::cout << "Failed to initialize GLAD" << std::endl;
        return -1;
    }
    // OpenGL渲染窗口的尺寸大小，即视口(Viewport)
    glViewport(0, 0, 800, 600);// 0 0 左下角,800 600 宽高
    // 循环渲染
    while (!glfwWindowShouldClose(window))// 检查一次GLFW是否被要求退出
    {
        glClearColor(0.2f, 0.3f, 0.3f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT);
        glfwSwapBuffers(window);// 函数会交换颜色缓冲：单缓冲可能会造成屏幕闪烁
        glfwPollEvents();// 函数检查有没有触发什么事件
        processInput(window);
    }
    // 释放/删除之前的分配的所有资源
    glfwTerminate();
    return 0;
}
```



# Bug

- 无法解析的外部符号gladLoadGLLoader

  - 原因分析

    这函数是属于glad的，用来加载OpenGL函数。

    说无法解析，说明没找到函数定义

  - 解决方法

    是引入glad.c文件到项目中目录下，并且包含

    因为glad.c文件写了找到具体函数地址，而glad.h只是提供调用函数声明的宏

  
