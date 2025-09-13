#!/usr/bin/env ruby
require 'net/http'
require 'json'
require 'uri'

# Test agent responses from Rails controllers
base_url = 'http://localhost:3000'

# Test endpoints
endpoints = [
  { path: '/dashboard?agent=true', method: 'GET', description: 'Dashboard' },
  { path: '/users?agent=true', method: 'GET', description: 'Users index' },
  { path: '/roles?agent=true', method: 'GET', description: 'Roles index' },
  { path: '/permissions?agent=true', method: 'GET', description: 'Permissions index' }
]

puts "Testing WebMCP agent responses...\n\n"

endpoints.each do |endpoint|
  uri = URI.parse(base_url + endpoint[:path])

  begin
    response = Net::HTTP.get_response(uri)

    if response.code == '200'
      # Extract JSON from the HTML response
      if response.body =~ /<script type="application\/json" id="agent-response">(.*?)<\/script>/m
        json_str = $1
        json_data = JSON.parse(json_str)
        puts "✓ #{endpoint[:description]}: SUCCESS"
        puts "  Response: #{json_data.inspect[0..100]}..."
      else
        puts "✗ #{endpoint[:description]}: No JSON found in response"
        puts "  Response body preview: #{response.body[0..200]}..."
      end
    elsif response.code == '302' || response.code == '303'
      puts "⚠ #{endpoint[:description]}: Redirect (#{response.code}) - Need authentication"
    else
      puts "✗ #{endpoint[:description]}: HTTP #{response.code}"
    end
  rescue => e
    puts "✗ #{endpoint[:description]}: Error - #{e.message}"
  end

  puts ""
end

puts "\nNote: If you're getting redirects, you need to be logged in to test these endpoints."
puts "You can test manually in the browser by adding ?agent=true to any URL."