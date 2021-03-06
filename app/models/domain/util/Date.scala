package models.domain.util

import org.joda.time.DateTime
import play.api.libs.json.{Json, OFormat}

case class Date(year: Int, month: Int, day: Int){
  def toDateTime : DateTime = new DateTime(year, month, day, 0, 0, 0)
  def isAfterNow : Boolean = toDateTime.isAfterNow
  def isBeforeNow : Boolean = toDateTime.isBeforeNow
  def toDateString: String = day + "/" + month + "/" + year
}

object Date extends DateJsonFormat{
  def now = Date(DateTime.now())
  def apply(dateTime: DateTime): Date = Date(dateTime.getYear, dateTime.getMonthOfYear, dateTime.getDayOfMonth)
}

trait DateJsonFormat{
  implicit val dateFormat: OFormat[Date] = Json.format[Date]
}
