' ============================================================
' chat_api 开机自启动脚本 (静默运行，无控制台窗口)
' ============================================================
Dim WShell, FSO, projectDir, pythonExe, logFile

Set WShell = CreateObject("WScript.Shell")
Set FSO   = CreateObject("Scripting.FileSystemObject")

' 项目目录 (脚本所在目录)
projectDir = FSO.GetParentFolderName(WScript.ScriptFullName)

' Python 路径 (使用 conda zyh 环境的 Python)
pythonExe = "C:\ProgramData\Anaconda3\envs\zyh\python.exe"

' 日志文件
logFile = projectDir & "\chat_api_startup.log"

' 如果 zyh 环境 Python 不存在，尝试系统默认 python
If Not FSO.FileExists(pythonExe) Then
    pythonExe = "python"
End If

' 写启动日志
On Error Resume Next
Dim logF
Set logF = FSO.OpenTextFile(logFile, 2, True)
logF.WriteLine "[" & Now & "] 正在启动 chat_api 服务..."
logF.Close

' 以隐藏窗口运行 (0 = 隐藏, false = 不等待)
WShell.CurrentDirectory = projectDir
Dim exitCode
exitCode = WShell.Run("""" & pythonExe & """ -u chat_api.py", 0, False)

If exitCode = 0 Then
    Set logF = FSO.OpenTextFile(logFile, 8, True)
    logF.WriteLine "[" & Now & "] chat_api 启动成功 (PID 获取受限)"
    logF.Close
Else
    Set logF = FSO.OpenTextFile(logFile, 8, True)
    logF.WriteLine "[" & Now & "] 启动失败, 错误码: " & exitCode
    logF.Close
End If

Set WShell = Nothing
Set FSO   = Nothing
