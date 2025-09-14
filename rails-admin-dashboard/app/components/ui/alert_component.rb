class Ui::AlertComponent < ViewComponent::Base
  def initialize(variant: :default, **options)
    @variant = variant
    @options = options
  end

  def call
    content_tag(:div, class: alert_classes, **@options) do
      content_tag(:div, class: "flex") do
        safe_join([icon_html, message_html].compact)
      end
    end
  end

  private

  def alert_classes
    base_classes = "rounded-md p-4"

    variant_classes = case @variant
    when :success
      "bg-green-50"
    when :error
      "bg-red-50"
    when :warning
      "bg-yellow-50"
    when :info
      "bg-blue-50"
    else
      "bg-gray-50"
    end

    "#{base_classes} #{variant_classes} #{@options[:class]}".strip
  end

  def icon_html
    return unless icon_svg

    content_tag(:div, class: "flex-shrink-0") do
      icon_svg.html_safe
    end
  end

  def message_html
    content_tag(:div, class: "ml-3") do
      content_tag(:p, content || @options[:message], class: message_classes)
    end
  end

  def message_classes
    case @variant
    when :success
      "text-sm font-medium text-green-800"
    when :error
      "text-sm font-medium text-red-800"
    when :warning
      "text-sm font-medium text-yellow-800"
    when :info
      "text-sm font-medium text-blue-800"
    else
      "text-sm font-medium text-gray-800"
    end
  end

  def icon_svg
    case @variant
    when :success
      '<svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
      </svg>'
    when :error
      '<svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
      </svg>'
    when :warning
      '<svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>'
    when :info
      '<svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
      </svg>'
    end
  end
end