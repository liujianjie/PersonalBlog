> 偏文字相关和细节方面，不是很重要

# 根据资源定位信息加载资源

## 知识点一：回顾学过的加载可寻址资源的方式

1. 通过标识类进行加载(指定资源加载) 

2. 通过资源名或标签名加载单个资源(动态加载)

   ```csharp
   Addressables.LoadAssetAsync<GameObject>("Cube")
   ```

3. 通过资源名或标签名或两者组合加载多个资源(动态加载)

   ```csharp
   Addressables.LoadAssetsAsync<GameObject>(new List<string>() { "Cube", "SD" }, (obj) => { }, Addressables.MergeMode.Intersection);
   ```

## 知识点二：加载资源时Addressables帮助我们做了哪些事情？

1. 查找指定键的资源位置
2. 收集依赖项列表
3. 下载所需的所有远程AB包
4. 将AB包加载到内存中
5. 设置Result资源对象的值
6. 更新Status状态变量参数并且调用完成事件Completed

- 如果加载成功

  Status状态为成功

  可以从Result中得到内容

- 如果加载失败

  Status状态为失败

  如果我们启用了 Log Runtime Exceptions选项 会在Console窗口打印信息

## 知识点三：根据名字或者标签获取 资源定位信息，然后再加载资源

```csharp
//参数一：资源名或者标签名
        //参数二：资源类型
        AsyncOperationHandle<IList<IResourceLocation>> handle = Addressables.LoadResourceLocationsAsync("Cube", typeof(GameObject));
        handle.Completed += (obj) =>
        {
            if(obj.Status == AsyncOperationStatus.Succeeded)
            {
                foreach (var item in obj.Result)
                {
                    //我们可以利用定位信息 再去加载资源
                    //print(item.PrimaryKey);
                    Addressables.LoadAssetAsync<GameObject>(item).Completed += (obj) =>
                    {
                        Instantiate(obj.Result);
                    };
                }
            }
            else
            {
                Addressables.Release(handle);
            }
        };
```

## 知识点四：根据名字标签组合信息获取 资源定位信息，然后再加载资源

```c#
//参数一：资源名和标签名的组合
        //参数二：合并模式
        //参数三：资源类型
        AsyncOperationHandle<IList<IResourceLocation>> handle2 = Addressables.LoadResourceLocationsAsync(new List<string>() { "Cube", "Sphere", "SD" }, Addressables.MergeMode.Union, typeof(Object));
        handle2.Completed += (obj) => { 
            if(obj.Status == AsyncOperationStatus.Succeeded)
            {
                //资源定位信息加载成功
                foreach (var item in obj.Result)
                {
                    //使用定位信息来加载资源
                    //我们可以利用定位信息 再去加载资源 （一些额外信息）
                    print("******");
                    print(item.PrimaryKey);
                    print(item.InternalId);
                    print(item.ResourceType.Name);

                    Addressables.LoadAssetAsync<Object>(item).Completed += (obj) =>
                    {
                        //Instantiate(obj.Result);
                    };
                }
            }
            else
            {
                Addressables.Release(handle);
            }
        };
```

## 知识点五：根据资源定位信息加载资源的注意事项

1. 资源信息当中提供了一些额外信息

   PrimaryKey：资源主键（资源名）

   InternalId：资源内部ID（资源路径）

   ResourceType：资源类型（Type可以获取资源类型名）

   我们可以利用这些信息处理一些特殊需求：比如加载多个不同类型资源时 可以通过他们进行判断再分别进行处理

2. 根据资源定位信息加载资源并不会加大我们加载开销

   因为只是分步完成加载了而已，与原来不根据资源定位信息加载的步骤一样

# 几种加载Addressable方式

##         知识点一: 回顾目前动态异步加载的使用方式

```csharp
    var handle = Addressables.LoadAssetAsync<GameObject>("Cube");
	// 完成事件监听
    handle.Completed += (obj) =>
    {
        if (handle.Status == AsyncOperationStatus.Succeeded)
        {
            Debug.Log("事件创建对象");
            Instantiate(obj.Result);
        }
    };
```

##         知识点二：3种使用异步加载资源的方式

```csharp
2.1事件监听:知识点一所做
2.2协同程序
2.3异步函数
```

## 知识点三：协程使用异步加载

```csharp
StartCoroutine(LoadAsset());
IEnumerator LoadAsset()
{
    handle = Addressables.LoadAssetAsync<GameObject>("Cube");
    if (!handle.IsDone)
    {
        yield return handle;
    }
    if (handle.Status == AsyncOperationStatus.Succeeded)
    {
        Debug.Log("协同程序创建对象");
        Instantiate(handle.Result);
    }
    else
    {
        Addressables.Release(handle);
    }
}
```

## 知识点四：异步函数

```csharp
// webgl平台不支持 async 和 await加载
Load();
async void Load()
{
    handle = Addressables.LoadAssetAsync<GameObject>("Cube");
    AsyncOperationHandle<GameObject> handle2 = Addressables.LoadAssetAsync<GameObject>("Sphere");

    //await handle.Task;
    //await handle2.Task;
    await Task.WhenAll(handle.Task, handle2.Task);// 等待多任务

    Debug.Log("异步函数的形式加载的资源");
    Instantiate(handle.Result);
    Instantiate(handle2.Result);
}
```

# Async Operation Handle

## 知识点一：获取加载进度

```csharp
IEnumerator LoadAsset()
{
    AsyncOperationHandle<GameObject> handle = Addressables.LoadAssetAsync<GameObject>("Sphere");
    //注意：如果该资源相关的AB包 已经加载过了 那么 只会打印0
    while (!handle.IsDone)
    {
        DownloadStatus info = handle.GetDownloadStatus();
        // 进度
        print(info.Percent);
        // 字节加载进度 代表AB包 加载了多少
        // 当前下载了多少内容 / 总体有多少内容 单位是字节数
        print(info.DownloadedBytes + "/" +info.TotalBytes);
        yield return 0;
    }
    if (handle.Status == AsyncOperationStatus.Succeeded)
    {
        Instantiate(handle.Result);
    }
    else
    {
        Addressables.Release(handle);
    }
}
```

## 知识点二 无类型句柄转换

```csharp
        AsyncOperationHandle<GameObject> handle = Addressables.LoadAssetAsync<GameObject>("Cube");
        AsyncOperationHandle temp = handle;
        //把无类型句柄 转换为 有类型的泛型对象
        handle = temp.Convert<GameObject>();
        handle.Completed += (obj) =>
        {
            Instantiate(handle.Result);
        };
```

## 知识点三 强制同步加载资源

```csharp
        print("1");
        handle.WaitForCompletion();
        print("2");
        print(handle.Result.name);
        Instantiate(handle.Result);
```

使用handle.WaitForCompletion();,会卡住线程

# 关于Async Operation Handle 练习题

```csharp
public Dictionary<string, AsyncOperationHandle> resDic = new Dictionary<string, AsyncOperationHandle>();
handle = resDic[keyName].Convert<T>();
resDic[keyName].Convert<IList<T>>();

public void Clear()
{
    foreach (var item in resDic.Values)
    {
        Addressables.Release(item);
    }
}
```


