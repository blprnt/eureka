# frozen_string_literal: true

class ProcessLocService < BaseService
  attr_reader :url, :status

  def is_number? string
    true if Float(string) rescue false
  end

  def call(status)

   @status = status

   if status.loc_id.length > 4
     @url = "null"

     puts "!----------********************************************--------!"
     puts "!----------********************************************--------!"
     puts "!----------********************************************--------!"
     puts "!----------********************************************--------!"

     puts status.loc_id

     beforeperiod = status.loc_id.split('.').first.split('/').first
     
     slug = status.loc_id

     if slug['?']
        slug = slug + '&'
     else
        slug = slug + '?'
     end

     case is_number? (beforeperiod)
     when true
       @url = 'https://www.loc.gov/item/' + slug + 'fo=json' 
     when false
       @url = 'https://www.loc.gov/resource/' + slug + 'fo=json' 
     else 
       @url='unknown'
     end

     fetch!
  end
  
  end

  def fetch!
    #return if @endpoint_url.blank?

    body = Request.new(:get, @url).perform do |res|
      res.code != 200 ? nil : res.body_with_limit
    end

    validate(body) if body.present?
  rescue Oj::ParseError, Ox::ParseError
    nil
  end

  def parse_json(body)
     Oj.load(body, mode: :strict)&.with_indifferent_access
  end

  def validate(json)
  	status.loc_json = json
  	status.save!
  end

end