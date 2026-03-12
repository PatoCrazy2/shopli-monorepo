@echo off
set SRC=apps\admin\src\app\(dashboard)\dashboard
set DST=apps\admin\src\app\dashboard

REM Move everything from (dashboard)/dashboard/ to dashboard/
robocopy "%SRC%" "%DST%" /E /MOVE

REM Remove the now-empty (dashboard) group folder
rmdir /s /q "apps\admin\src\app\(dashboard)"

echo Done.
