
(function() {
  var me = document.querySelector('#me')
  if (!me) {
    return
  }

  var protected_users = {
    dang: 1,
    tomhow: 1
  }
  protected_users[me.textContent] = 1

  var hnbans = indexedDB.open('hnbans', 1)

  hnbans.onerror = function() {
    console.log('hnbans error', hnbans.error)
  }

  hnbans.onupgradeneeded = function() {
    var db = hnbans.result
    if (db.objectStoreNames.contains('users')) {
      return
    }
    db.createObjectStore('users', {keyPath: 'value'})
  }

  hnbans.onsuccess = function() {
    var db = hnbans.result

    var divider = function() {
      var span = document.createElement('span')
      span.textContent = ' | '
      return span
    }

    var in_banlist = function(username, error, success) {
      var tx = db.transaction('users', 'readonly')
      var query = tx.objectStore('users').get(username)

      query.onerror = function() {
        error(query.error)
      }

      query.onsuccess = function() {
        success(query.result)
      }
    }

    var add_to_banlist = function(username, error, success) {
      var tx = db.transaction('users', 'readwrite')
      var put = tx.objectStore('users').put({value: username})
      put.onerror = function() {
        error(put.error)
      }
      put.onsuccess = success
    }

    var remove_from_banlist = function(username, error, success) {
      var tx = db.transaction('users', 'readwrite')
      var remove = tx.objectStore('users').delete(username)
      remove.onerror = function() {
        error(remove.error)
      }
      remove.onsuccess = success
    }

    var {pathname, search} = location

    if (`${pathname}${search}` === `/user?id=${me.textContent}`) {
      document.querySelector('#bigbox').insertAdjacentHTML('afterend', [
        '<tr>',
          '<td>',
            '<table>',
              '<tbody>',
                '<tr>',
                  '<td valign="top">banlist:</td>',
                  '<td>',
                    '<select id="banlist" multiple></select>',
                    '<br>',
                    '<br>',
                    '<button id="remove-from-banlist">remove selected</button>',
                  '</td>',
                '</tr>',
                '<tr>',
                  '<td valign="top">add to banlist:</td>',
                  '<td>',
                    '<input id="ban">',
                    '<br>',
                    '<br>',
                    '<button id="add-to-banlist">add</button>',
                  '</td>',
                '</tr>',
              '</tbody>',
            '</table>',
          '</td>',
        '</tr>',
      ].join(''))

      var tx = db.transaction('users', 'readonly')
      var query = tx.objectStore('users').getAll()

      query.onerror = function() {
        console.log('hnbans error', query.error)
      }

      query.onsuccess = function() {
        var banlist = document.getElementById('banlist')
        var ban = document.getElementById('ban')
        var add = document.getElementById('add-to-banlist')
        var remove = document.getElementById('remove-from-banlist')

        banlist.size = 10
        banlist.style.width = '25ch'

        query.result.forEach(function(username) {
          var option = document.createElement('option')
          option.value = username.value
          option.textContent = username.value
          banlist.appendChild(option)
        })

        add.onclick = function() {
          if (!ban.value) {
            return
          }

          add_to_banlist(
            ban.value,
            console.log.bind(console, 'hnbans error'),
            location.reload.bind(location)
          )
        }

        remove.onclick = function() {
          var selected = Array.from(banlist.selectedOptions)
          if (!selected.length) {
            return
          }

          Promise.all(
            selected.map(function(option) {
              return new Promise(function(resolve, reject) {
                remove_from_banlist(
                  option.value,
                  reject,
                  resolve
                )
              })
            })
          ).then(function() {
            location.reload()
          }).catch(function(err) {
            console.log('hnbans error', err)
          })
        }
      }
    } else if (pathname === '/item' || pathname === '/threads') {
      Promise.all(
        Array.from(
          document.querySelectorAll('.comhead')
        ).map(async function(comhead) {
          var commenter = comhead.querySelector('.hnuser')
          if (!commenter || commenter.textContent in protected_users) {
            return
          }

          in_banlist(
            commenter.textContent,
            console.log.bind(console, 'hnbans error'),
            function(banned) {
              var navs = comhead.querySelector('.navs')
              var ban_divider = divider()

              var ban = document.createElement('a')
              ban.textContent = banned ? 'unban' : 'ban'
              ban.href = 'javascript:void(0)'
              ban.onclick = function() {
                var action = banned ? remove_from_banlist : add_to_banlist
                action(
                  commenter.textContent,
                  console.log.bind(console, 'hnbans error'),
                  location.reload.bind(location)
                )
              }

              var clicky = navs.querySelector('.clicky')

              navs.insertBefore(ban_divider, clicky)
              navs.insertBefore(ban, ban_divider)

              if (!banned) {
                return
              }

              var td_default = comhead.parentNode.parentNode
              var comment = td_default.querySelector('.comment')
              var comment_text = comment.querySelector('.commtext')
              comment_text.style.display = 'none'
              var notice = document.createElement('p')
              var br = document.createElement('br')
              var toggle = document.createElement('a')

              notice.textContent = '[user is banned]'
              notice.appendChild(br)
              toggle.textContent = 'show comment'
              toggle.href = 'javascript:void(0)'
              toggle.onclick = function() {
                if (comment_text.style.display === 'none') {
                  comment_text.style.display = ''
                  toggle.textContent = 'hide comment'
                  return
                }
                comment_text.style.display = 'none'
                toggle.textContent = 'show comment'
              }

              comment.insertBefore(notice, comment.querySelector('.commtext'))

              var toggle_divider = divider()

              navs.insertBefore(toggle_divider, clicky)
              navs.insertBefore(toggle, toggle_divider)

              var reply = td_default.querySelector('.comment .reply')
              var reply_parent = reply.parentNode
              reply_parent.removeChild(reply)
            }
          )
        })
      ).catch(function(err) {
        console.log('hnbans error', err)
      })
    } else {
      Promise.all(
        Array.from(
          document.querySelectorAll('.athing.submission + tr')
        ).map(async function(submission_byline) {
          var submitter = submission_byline.querySelector('.hnuser')
          if (!submitter || submitter.textContent in protected_users) {
            return
          }

          in_banlist(
            submitter.textContent,
            console.log.bind(console, 'hnbans error'),
            function(banned) {
              if (!banned) {
                return
              }

              var submission_id = submission_byline.querySelector('.score').id.split('_').pop()
              var submission = document.getElementById(submission_id)
              if (!submission) {
                return
              }

              var submission_title = submission.querySelector('.titleline a')
              submission_title.textContent = '[banned user submission] ' + submission_title.textContent

              var subline = submission_byline.querySelector('.subline')

              var unban_divider = divider()

              var unban = document.createElement('a')
              unban.textContent = 'unban'
              unban.href = 'javascript:void(0)'
              unban.onclick = function() {
                remove_from_banlist(
                  submitter.textContent,
                  console.log.bind(console, 'hnbans error'),
                  location.reload.bind(location)
                )
              }

              subline.insertBefore(unban_divider, subline.querySelector('.clicky'))
              subline.insertBefore(unban, unban_divider)
            }
          )
        })
      ).catch(function(err) {
        console.log('hnbans error', err)
      })
    }
  }
})()
