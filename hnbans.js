
(function() {
  var me = document.querySelector('#me')
  if (!me) {
    return
  }

  var hnbans = indexedDB.open('hnbans', 1)

  hnbans.onupgradeneeded = function(event) {
    var db = event.target.result
    if (db.objectStoreNames.contains('users')) {
      return
    }
    db.createObjectStore('users', {keyPath: 'value'})
  }

  hnbans.onerror = function() {
    console.log('hnbans error', hnbans.error)
  }

  hnbans.onsuccess = function() {
    var db = hnbans.result

    var {pathname, search} = location

    if (`${pathname}${search}` === `/user?id=${me.textContent}`) {
      var hnbans_options = [
        '<tr>',
          '<td>',
            '<table>',
              '<tbody>',
                '<tr>',
                  '<td valign="top">banlist:</td>',
                  '<td>',
                    '<textarea id="banlist" rows="10"></textarea>',
                    '<br>',
                    '<br>',
                    '<button id="update-banlist">update banlist</button>',
                  '</td>',
                '</tr>',
              '</tbody>',
            '</table>',
          '</td>',
        '</tr>',
      ].join('')

      var tx = db.transaction('users', 'readonly')
      var query = tx.objectStore('users').getAll()
      
      query.onsuccess = function() {
        var textarea = document.getElementById('banlist')
        var button = document.getElementById('update-banlist')

        textarea.value = query.result.map(function(username) {
          return username.value
        }).join('\n')

        button.onclick = function() {
          var tx = db.transaction('users', 'readwrite')

          var clear = tx.objectStore('users').clear()

          clear.onsuccess = function() {

            Promise.all(
              textarea.value.split('\n').map(function(username) {
                return new Promise(function(resolve, reject) {
                  if (
                    username === me.textContent ||
                    username === 'dang' ||
                    usename === 'tomhow'
                  ) {
                    resolve()
                    return
                  }

                  var tx = db.transaction('users', 'readwrite')
                  var put = tx.objectStore('users').put({value: username})

                  put.onsuccess = function() {
                    resolve()
                  }
                  
                  put.onerror = function() {
                    reject(query.error)
                  }
                })
              })
            ).then(function() {
              location.reload()
            }).catch(function(err) {
              console.log('hnbans error', err)
            })
          }

          clear.onerror = function() {
            console.log('hnbans error', clear.error)
          }
        }
      }
      
      query.onerror = function() {
        console.log('hnbans error', query.error)
      }

      document.querySelector('#bigbox').insertAdjacentHTML('afterend', hnbans_options)
    }

    if (pathname === '/item' || pathname === '/threads') {

      Promise.all(
        Array.from(
          document.querySelectorAll('.comhead')
        ).map(async function(comhead) {
          var commenter = comhead.querySelector('.hnuser')
          if (!commenter) {
            return
          }

          if (
            commenter.textContent === me.textContent ||
            commenter.textContent === 'dang' ||
            commenter.textContent === 'tomhow'
          ) {
            return
          }

          var tx = db.transaction('users', 'readonly')
          var query = tx.objectStore('users').get(commenter.textContent)
          
          query.onsuccess = function() {
            var banned = query.result

            var navs = comhead.querySelector('.navs')

            var divider = document.createElement('span')
            divider.textContent = ' | '

            var ban = document.createElement('a')
            ban.classList.add('ban')
            ban.textContent = banned ? 'unban' : 'ban'
            ban.href = 'javascript:void(0)'
            ban.onclick = function() {
              if (banned) {
                var tx = db.transaction('users', 'readwrite')
                var remove = tx.objectStore('users').delete(commenter.textContent)

                remove.onsuccess = function() {
                  location.reload()
                }
                
                remove.onerror = function() {
                  console.log('hnbans error', remove.error)
                }
                return
              }

              var tx = db.transaction('users', 'readwrite')
              var put = tx.objectStore('users').put({value: commenter.textContent})

              put.onsuccess = function() {
                location.reload()
              }
              
              put.onerror = function() {
                console.log('hnbans error', put.error)
              }
            }

            navs.insertBefore(divider, navs.querySelector('.clicky'))
            navs.insertBefore(ban, divider)

            if (!banned) {
              // commenter is not in the banlist
              return
            }

            var td_default = comhead.parentNode.parentNode
            var comment = td_default.querySelector('.comment .commtext')
            comment.textContent = '[user is banned]'
            var reply = td_default.querySelector('.comment .reply')
            var reply_parent = reply.parentNode
            reply_parent.removeChild(reply)
          }

          query.onerror = function() {
            console.log('hnbans error', query.error)
          }
        })
      ).catch(function(err) {
        console.log('hnbans error', err)
      })
    }

    Promise.all(
      Array.from(
        document.querySelectorAll('.athing.submission + tr')
      ).map(async function(submission_byline) {
        var submitter = submission_byline.querySelector('.hnuser')
        if (!submitter) {
          return
        }
        
        if (
          submitter.textContent === me.textContent ||
          submitter.textContent === 'dang' ||
          submitter.textContent === 'tomhow'
        ) {
          return
        }

        var tx = db.transaction('users', 'readonly')
        var query = tx.objectStore('users').get(submitter.textContent)
        
        query.onsuccess = function() {
          if (!query.result) {
            // submitter is not in the banlist
            return
          }

          var submission_id = submission_byline.querySelector('.score').id.split('_').pop()
          var submission = document.getElementById(submission_id)
          var submission_parent = submission.parentNode
          submission_parent.removeChild(submission)
          var submission_byline_parent = submission_byline.parentNode
          submission_byline_parent.removeChild(submission_byline)
        }

        query.onerror = function() {
          console.log('hnbans error', query.error)
        }
      })
    ).catch(function(err) {
      console.log('hnbans error', err)
    })
  }
})()
