#! /usr/local/python/bin/python3
import os
import sys
import daemon
import time
import tornado.ioloop
import tornado.web
import tornado.websocket
from tornado.options import options, parse_command_line

port = 8000
host = "123.456.789.10"
clients = {}
path = os.path.dirname(__file__)
class IndexHandler(tornado.web.RequestHandler):
  @tornado.web.asynchronous
  def get(self):
    self.render(os.path.join(path, "index.html"))

class CtlHandler(tornado.web.RequestHandler):
  @tornado.web.asynchronous
  def get(self):
    self.render(os.path.join(path, "ctl.html"))

class SendWebSocket(tornado.websocket.WebSocketHandler):
  def open(self):
    self.room = ""
    print("WebSocket opened")

  def on_message(self, message):
    # the structure of message is "roomname@jsondata"
    t = message.split('@')
    room = t[0]
    json = t[1]
    if room not in clients.keys():
      # create new room
      self.room = room
      clients[room] = [self]
    else:
      if self not in clients[room]:
        # add self to the room
        self.room = room
        clients[room].append(self)
    for cl in clients[room]:
      cl.write_message(json)

  def on_close(self):
    if self.room != "" and self in clients[self.room]:
      clients[self.room].remove(self)
      if len(clients[self.room]) == 0:
        del clients[self.room]
    print("WebSocket closed" + self.name)

class Draw(tornado.web.RequestHandler):
  @tornado.web.asynchronous
  def get(self):
    user_name = self.get_argument("name")
    room = self.get_argument("room")
    if user_name == "":
      self.render(os.path.join(path, "error.html"), content="Your name is empty.", host=host, port=port)
    elif room == "":
      self.render(os.path.join(path, "error.html"), content="Room name is empty.", host=host, port=port)
    elif '@' in room or '@' in user_name:
      self.render(os.path.join(path, "error.html"), content="You cannot use '@' in the room name or your name.", host=host, port=port)
    else:
      self.render(os.path.join(path, "draw.html"), name=user_name, room=room, host=host, port=port)

settings = {
    "static_path": os.path.join(path, "static")
}
app = tornado.web.Application([
  (r"/", IndexHandler),
  (r"/ctl", CtlHandler),
  (r"/ws", SendWebSocket),
  (r"/draw", Draw),
], **settings)

if __name__ == "__main__":
  with daemon.DaemonContext():
    print(path)
    parse_command_line()
    app.listen(port)
    tornado.ioloop.IOLoop.instance().start()

