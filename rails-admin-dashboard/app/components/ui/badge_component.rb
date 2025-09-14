class Ui::BadgeComponent < ViewComponent::Base
  def initialize(variant: :default, **options)
    @variant = variant
    @options = options
  end

  def call
    content_tag(:span, content || @options.delete(:text), class: badge_classes, **@options)
  end

  private

  def badge_classes
    base_classes = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"

    variant_classes = case @variant
    when :primary
      "bg-indigo-100 text-indigo-800"
    when :secondary
      "bg-gray-100 text-gray-800"
    when :destructive
      "bg-red-100 text-red-800"
    when :success
      "bg-green-100 text-green-800"
    when :warning
      "bg-yellow-100 text-yellow-800"
    when :info
      "bg-blue-100 text-blue-800"
    when :purple
      "bg-purple-100 text-purple-800"
    else
      "bg-gray-100 text-gray-800"
    end

    "#{base_classes} #{variant_classes} #{@options[:class]}".strip
  end
end