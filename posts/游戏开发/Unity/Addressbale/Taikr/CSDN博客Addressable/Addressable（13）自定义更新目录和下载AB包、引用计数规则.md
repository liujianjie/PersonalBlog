> 偏文字相关和细节方面，不是很重要

# 自定义更新目录和下载AB包

## 知识点一：目录的作用

- Json文件

  1. 加载AB包、图集、资源、场景、实例化对象所用的脚本（会通过反射去加载他们来使用）
  2. AB包中所有资源类型对应的类（会通过反射去加载他们来使用）
  3. AB包对应路径
  4. 资源的path名

  ![image-20231219130200055](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402182355724.png)

- Hash文件(发布远程才有)

  - 记录什么

    目录文件对应hash码（每一个文件都有一个唯一码，用来判断文件是否变化）

    ![image-20231219130335279](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402182355927.png)

    ![image-20231219130404281](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402182355938.png)

  - 作用

    更新时本地的文件hash码会和远端目录的hash码进行对比

    如果发现不一样就会更新目录文件

  - 补充

    当我们使用远端发布内容时，在资源服务器也会有一个目录文件

    Addressables会在运行时自动管理目录

    如果远端目录发生变化了(他会通过hash文件里面存储的数据判断是否是新目录)

    它会自动下载新版本并将其加载到内存中


## 知识点二：手动更新目录

1. 如果要手动更新目录 建议在设置中关闭自动更新

   ![image-20231221124539416](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402182355955.png)

2. 自动检查所有目录是否由更新，并更新目录API

   ```csharp
           Addressables.UpdateCatalogs().Completed += (obj) =>
           {
               Debug.Log(obj.DebugName);
               Addressables.Release(obj);
           };
   ```

3. 获取目录列表，再更新目录

   ```csharp
   // 参数bool就是加载结束后，不会自动释放异步加载得句柄
   Addressables.CheckForCatalogUpdates(true).Completed += (obj) =>
   {
       // 如果列表里面内容大于0，证明可以更新得目录
       if (obj.Result.Count > 0)
       {
           Debug.Log(obj.DebugName);
           // 根据别列表更新目录
           Addressables.UpdateCatalogs(obj.Result, true).Completed += (handle) =>
           {
               Debug.Log(obj.DebugName);
               // 自动释放
               //Addressables.Release(handle);
               //Addressables.Release(obj);
           };
       }
   };
   ```


## 知识点三：预加载包

```csharp
    IEnumerator LoadAsset()
    {
        //1.首先获取下载包的大小
        AsyncOperationHandle<long> handleSize = Addressables.GetDownloadSizeAsync(new List<string>() { "Cube", "Sphere", "SD" });
        yield return handleSize;

        Debug.Log($"handleSize.Result {handleSize.Result}");
        //2.预加载
        if (handleSize.Result > 0)
        {
            Debug.Log(handleSize.Result);
            AsyncOperationHandle handle = Addressables.DownloadDependenciesAsync(new List<string>() { "Cube", "Sphere", "SD" }, Addressables.MergeMode.Union);
            while (!handle.IsDone)
            {
                // 3.加载进度
                DownloadStatus info = handle.GetDownloadStatus();
                Debug.Log(info.Percent);
                Debug.Log(info.DownloadedBytes + "/" + info.TotalBytes);
                yield return 0;
            }
            Debug.Log(handle.Result.ToString());// 是个IList
            // 可恶，加载不出来
            //var res = handle.Result.Convert<IList<Object>>();
            //Instantiate(res);
            //var gh = handle.Convert<IList<GameObject>>();
            //foreach (var go in handle.Result)
            //{
            //    Instantiate(handle.Result);
            //}
            Addressables.Release(handle);
        }
    }
```

![image-20231221130429362](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402182355617.png)

# 引用计数规则

## 知识点一：什么是引用计数规则？

- 介绍

  当我们通过加载使用可寻址资源时，Addressables会在内部帮助我们进行引用计数

  为了避免内存泄露（不需要使用的内容残留在内存中）

  我们要保证加载资源和卸载资源是配对使用的

- 计数

  - 资源计数

    使用资源时，引用计数+1

    释放资源时，引用计数-1

    当可寻址资源的引用为0时，就可以卸载它了

    我们可以使用`Resources.UnloadUnusedAssets`卸载资源（建议在切换场景时调用）

  - AB包计数

    AB包也有自己的引用计数（Addressables把它也视为可寻址资源）

    从AB包中加载资源时，引用计数+1

    从AB包中卸载资源时，引用计数-1

    当AB包引用计数为0时，意味着不再使用了，这时会从内存中卸载

  - 两者关系

    注意：释放的资源不一定立即从内存中卸载

    在卸载资源所属的**AB**包之前，不会释放**资源**使用的内存

    (比如资源自己所在的AB包 被别人使用时，这时AB包不会被卸载，所以自己还在内存中)

- 主动调用

  我们可以使用`Resources.UnloadUnusedAssets`卸载资源（建议在切换场景时调用）

- 总结

  Addressables内部会通过引用计数帮助我们管理内存

  我们只需要保证 加载和卸载资源配对使用即可

## 知识点二：举例说明引用计数

- 代码

  ```csharp
      private List<AsyncOperationHandle<GameObject>> list = new List<AsyncOperationHandle<GameObject>>();
      // Update is called once per frame
      void Update()
      {
          if (Input.GetKeyDown(KeyCode.Space))
          {
              AsyncOperationHandle<GameObject> handle = Addressables.LoadAssetAsync<GameObject>("Cube");
              handle.Completed += (obj) =>
              {
                  Instantiate(obj.Result);
              };
              list.Add(handle);
          }
          if (Input.GetKeyDown(KeyCode.Q))
          {
              if(list.Count > 0)
              {
                  Addressables.Release(list[0]);
                  list.RemoveAt(0);
              }
          }
      }
  ```

- 需要将AB包设置为本地加载

  ![image-20231222130424373](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402190004655.png)

  并且第三种模式ab加载

  ![image-20231222131139816](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402182356425.png)

- 加载一个Cube效果

  - 空格

    ![image-20231222130552343](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402190004960.png)

    此时资源A计数1，AB计数1

  - Q

    此时资源A计数0，AB计数0

    直接销毁

    ![image-20231222131204454](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402190004763.png)

- 加载二个Cube效果

  - 两次空格

    ![image-20231222130912922](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402190004738.png)

    资源A计数：1，资源B计数1，AB计数：2

  - 第一次Q

    资源计数：0，资源B计数1，AB计数：1

  - 第二次Q

    资源计数：0，资源B计数0，AB计数：0

    销毁

    ![image-20231222131226747](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402190004619.png)





## 知识点三：回顾之前写的资源管理器

一直复用一个handle，这样新增的资源，AB包计数永远为1，只要一个资源cube被release，从这个Ab包加载的其它资源也会被release

# 引用计数规则 练习题

关键代码

```csharp
public class AddressablesInfo
{
    // 记录 异步操作句柄
    public AsyncOperationHandle handle;
    // 记录引用计数
    public uint count;

    public AddressablesInfo(AsyncOperationHandle handle)
    {
        this.handle = handle;
        count += 1;
    }
}

    // 由于AsyncOperationHandle继承IEnumerator，所以可以用父类表示子类，这样就不需要声明时指定泛型（里式变换）
    //public Dictionary<string, AsyncOperationHandle> resDic = new Dictionary<string, AsyncOperationHandle>();
    // value存储异步加载的返回值
    public Dictionary<string, AddressablesInfo> resDic = new Dictionary<string, AddressablesInfo>();

    public void LoadAssetAsync<T>(string name, Action<AsyncOperationHandle<T>> callBack)
    {
        string keyName = name + "_" + typeof(T).Name;
        AsyncOperationHandle<T> handle;
        if (resDic.ContainsKey(keyName))
        {
            handle = resDic[keyName].handle.Convert<T>();
            // 引用计数+1
            resDic[keyName].count += 1;
            ...
                
       // 卸载单个资源
    public void Release<T>(string name)
    {
        string keyName = name + "_" + typeof(T).Name;
        if (resDic.ContainsKey(keyName))
        {
            // 释放时，引用计数-1
            resDic[keyName].count -= 1;
            // 如果引用计数为0，才真正释放
            if (resDic[keyName].count == 0)
            {
                AsyncOperationHandle<T> handle = resDic[keyName].handle.Convert<T>();
                Addressables.Release(handle);
                resDic.Remove(keyName);
            }
        }
    }
```


