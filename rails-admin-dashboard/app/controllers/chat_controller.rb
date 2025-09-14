class ChatController < ApplicationController
  def index
    @messages = Message.all.order(created_at: :asc)
    @message = Message.new
  end

  def create
    @message = Message.new(message_params)
    @message.user = current_user

    if @message.save
      ActionCable.server.broadcast(
        "chat_channel",
        {
          html: render_to_string(partial: "message", locals: { message: @message })
        }
      )
      head :ok
    else
      @messages = Message.all.order(created_at: :asc)
      render :index, status: :unprocessable_entity
    end
  end

  private

  def message_params
    params.require(:message).permit(:content)
  end
end
