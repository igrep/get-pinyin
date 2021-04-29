" Example Neovim script to interact with get-pinyin.js

"" Example key mapping:
noremap <F9> :<C-u>call g:GetPinyinSendCurrentLine()<CR>

let g:get_pinyin_job = 0

let s:tasks = []

function! s:OnStdout(_job_id, data, _event) dict abort
  if empty(s:tasks) | return | endif
  let ln = remove(s:tasks, -1)
  let lin = getline(ln)
  call setline(ln, lin . '  ' . trim(join(a:data)))
endfunction

function! s:OnStderr(_job_id, data, _event) dict abort
  if empty(s:tasks)
    echomsg "Error " . join(a:data)
    return
  endif
  let ln = remove(s:tasks, -1)
  echomsg "Error " . join(a:data) . " at " . string(ln)
endfunction

function! g:GetPinyinStart() abort
  let callbacks = {
        \ 'on_stdout': function('s:OnStdout'),
        \ 'on_stderr': function('s:OnStderr'),
        \ }
  let g:get_pinyin_job = jobstart(['node.exe', '.\get-pinyin.js', '--prompt', ''], callbacks)
endfunction

function! g:GetPinyinSendCurrentLine() abort
  let words = split(getline('.'), '  \+')
  if empty(words)
    echo "ERROR: Empty line"
    return
  endif

  if g:get_pinyin_job == 0
    echoerr "get-pinyin script isn't started yet! Run :call g:GetPinyinStart()!"
    return
  endif
  call add(s:tasks, line('.'))
  call chansend(g:get_pinyin_job, words[0] . "\n")
endfunction

function! g:GetPinyinStop() abort
  call jobstop(g:get_pinyin_job)
endfunction
