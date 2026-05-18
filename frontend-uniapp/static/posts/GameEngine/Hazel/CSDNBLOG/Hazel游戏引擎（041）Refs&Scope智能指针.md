> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  只是将shared_ptr与unique_ptr给与**别名**

# 代码修改

- Core.h

  ```cpp
  #pragma once
  #include <memory>
  
  .....
  namespace Hazel {
  	template<typename T>
  	using Scope = std::unique_ptr<T>;
  
  	template<typename T>
  	using Ref = std::shared_ptr<T>;
  }
  ```

  将项目中的shared_ptr<T>变为Ref名字

# 指针的讨论

## 应该为哪种指针

- 前置C++知识

  | 指针类型     | 释放策略                     | 离开作用域时指针是否被释放 |
  | ------------ | ---------------------------- | -------------------------- |
  | `shared_ptr` | 引用计数                     | 是，当引用计数为0时        |
  | `unique_ptr` | 独占所有权，不允许共享所有权 | 是                         |

- 有人说ExampleLayer中的Shader指针应该为unique_ptr，而不是shared_ptr

  Cherno解释说：

  - 目前运行机制是

    C++程序上传数据给shader去渲染，这一段过程需要时间

    而电脑屏幕显示的是**上一帧**，显卡现在在渲染**当前帧**。

  - 假设这个类指针指向OpenGLShader，且这个指针是<font color="red">unique_ptr</font>

    1. 在Renderer中需要用到OpenGLShader上传数据给显卡上的Shader程序，这需要时间。
    2. 但是若当前Renderer的容器ExampleLayer**关闭**了，指针离开作用域，那么这个OpenGLShader指针指向的内存也会被**释放**
    3. 而Renderer中并不知道，还在使用这个指针指向的内存，就会<font color="red">报错</font>。

- 解决方法

  1. 所以需要用shared_ptr指向OpenGLShader
  2. 这样用shared_ptr做**参数**，上传数据时指针计数为2
  3. 当ExampleLayer销毁，shared_ptr离开作用域，指针计数减一
  4. 计数为1，这个OpenGLShader指针指向的内存就<font color="green">不会销毁了</font>。

## 项目中ExampleLayer、Renderer、OpenGLShader(shared_ptr)协作代码

- ExampleLayer中

  ```cpp
  std::shared_ptr<Hazel::Shader> m_Shader;				// shader类 指针
  
  Hazel::Renderer::Submit(m_Shader, m_VertexArray);// 在Onupdate函数中
  ```

- Renderer的Submit函数

  ```cpp
  void Renderer::Submit(const std::shared_ptr<Shader>& shader, const std::shared_ptr<VertexArray>& vertexArray, glm::mat4 transform)
  {
      vertexArray->Bind(); // 绑定顶点数组
      shader->Bind();		// 绑定shader
      // 上传矩阵数据到glsl////////////////////////////////////////////////////////
      std::dynamic_pointer_cast<Hazel::OpenGLShader>(shader)->UploadUniformMat4("u_ViewProjection", m_SceneData->ViewProjectionMatrix);
  
      std::dynamic_pointer_cast<Hazel::OpenGLShader>(shader)->UploadUniformMat4("u_Transform", transform);
  
      RenderCommand::DrawIndexed(vertexArray);
  }
  ```

  可见：Renderer的Submit函数中需要**保持m_Shader存在**才可不会报错

## 个人对项目中函数为shared_ptr&的思考

- 我个人有点好奇

  项目中函数的形参是引用，这样计数根本不会增加。

  1. 所以当ExampleLayer销毁

  2. shared_ptr离开作用域

  3. 指针计数减一，计数为<font color="red">0</font>

     这个OpenGLShader指针指向的内存还是<font color="red">会被释放</font>呀？

  经过下面Demo代码才得出

  - OpenGLShader指针指向的内存<font color="green">不会被释放</font>

    1. 函数形参是shared_ptr引用
    2. 实参赋予这个参数时，计数**不会**加1
    3. 这个函数执行完，形参不会被销毁，也就**不会**执行计数减1

  - 而且由于shared_ptr是引用

    和之前讨论把unique_ptr换成shared_ptr避免空引用的计数步骤**不一致**

- Demo代码：说明unique_ptr、shared_ptr及引用计数

  ```c++
  #include <iostream>
  #include <memory>
  using namespace std;
  
  void deletefun(string* p)
  {
  	cout << "deletefun" << endl;
  	delete p;
  }
  void process1(shared_ptr<string> ptr)
  {
  	cout << "process1的shared_ptr引用计数：" << ptr.use_count() << endl;
  	cout << *ptr << endl;
  	// shared_ptr离开作用域确实会销毁内存的
  	shared_ptr<string> ptr2(new string("2"), deletefun);
  }
  void process2(shared_ptr<string>& ptr)
  {
  	cout << "process2的shared_ptr引用计数：" << ptr.use_count() << endl;
  	cout << *ptr << endl;
  }
  int main()
  {
  	string* st2 = new string("unique string");
  	unique_ptr<string> uptr1_3(st2);
  	//unique_ptr<string> uptr1_4 = uptr1_3; // 不能拷贝、赋值
  	
  	// unique_ptr，测试1
  	string* st1 = new string("unique string");
  	unique_ptr<string> uptr1_1(st1);
  	unique_ptr<string> uptr1_2(st1);
  
  	cout << *st1 << endl;
  	cout << *uptr1_1 << endl;
  	cout << *uptr1_2 << endl;
  	uptr1_1.reset();				// unique一个指针reset，原st1的内存被释放
  	//cout << *st1 << endl;		// 为空
  
  	/*
  		unique_ptr测试1中，有两个unique_ptr指向同一个内存，uptr1_1执行reset，已经将st1的内存释放，但是
  		uptr1_2却不知道，当main函数结束的时候，uptr1_2离开作用域会继续执行将st1的内存释放，而这会引发错误
  	*/
  
  	// shader_ptr，测试1
  	string* s1 = new string("share string1");
  	shared_ptr<string> sptr1_1(s1);
  	shared_ptr<string> sptr1_2(s1);
  	cout << *s1 << endl;
  	cout << *sptr1_1 << endl;
  	cout << *sptr1_2 << endl;
  	sptr1_1.reset();					// shared一个指针reset，另外一个shared是直接初始化，原s1的内存会被释放
  	// cout << *sptr1_2 << endl;		// 为空
  
  	/*
  		shader_ptr测试1中，有两个shader_ptr指向同一个内存，sptr1_1执行reset，已经将s1的内存释放，但是
  		sptr1_2却不知道，当main函数结束的时候，sptr1_2离开作用域会继续执行将s1的内存释放，而这会引发错误
  	*/
  
  	// shader_ptr，测试2
  	string* s2 = new string("share string2");
  	shared_ptr<string> sptr2_1(s2);
  	shared_ptr<string> sptr2_2 = sptr2_1;	// 拷贝构造函数，也可以计数
  	cout << *s2 << endl;
  	cout << *sptr2_1 << endl;
  	cout << *sptr2_2 << endl;
  	sptr2_1.reset();					// shared一个指针reset，另外一个shared是引用，原s2的内存 不 会被释放	
  	cout << *sptr2_2 << endl;		// 不为空，照样输出
  
  	// shader_ptr，测试3
  	string* s3 = new string("share string3");
  	shared_ptr<string> sptr3_1(s3, deletefun);
  	/*
  		sptr3_1引用计数为1，给process1函数形参计数为2，形参离开作用域销毁为1，所以没释放s3内存
  	*/
  	process1(sptr3_1);
  
  	cout << *s3 << endl;
  	cout << *sptr3_1 << endl;
  	sptr3_1.reset();				// shared计数为1，reset计数为0，原s3的内存会被释放	
  	//cout << *s3 << endl;		// 为空
  	
      ////////////////////////////重点在这/////////////////////////////////////////////////
      ////////////////////////////对应项目中的使用:形参是shared_ptr引用////////////////////////
  	// shader_ptr，测试4
  	string* s4 = new string("share string4");
  	shared_ptr<string> sptr4_1(s4);
  	/*
  		由于process2的形参是引用，接受实参时，并不会增加计数，当离开作用域时候，形参也不会减少计数，所以s4的内存还存在
  	*/
  	process2(sptr4_1);
  	cout << *s4 << endl;
  	cout << *sptr4_1 << endl;
  	sptr4_1.reset();				// shared计数为1，reset计数为0，原s4的内存会被释放		
  	cout << *s4 << endl;		// 为空
  
  	cin.get();
  	return 0;
  }
  
  ```

  结果

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307022051210.png)

  