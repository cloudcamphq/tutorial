using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace quickstart.Pages
{
  public class IndexModel : PageModel
  {
    private readonly ILogger<IndexModel> _logger;

    public IndexModel(ILogger<IndexModel> logger)
    {
      _logger = logger;
    }

    public int VisitsCount { set; get; }

    public void OnGet()
    {
      this.VisitsCount = 0;
      if (Environment.GetEnvironmentVariable("DATABASE_URL") != null)
      {
        using var con = new NpgsqlConnection(this.ConnectionString());
        con.Open();

        using var cmd = new NpgsqlCommand();
        cmd.Connection = con;

        cmd.CommandText = "CREATE TABLE IF NOT EXISTS visits_counter AS SELECT 0 as visits_count;";
        cmd.ExecuteNonQuery();

        cmd.CommandText = "UPDATE visits_counter SET visits_count = visits_count + 1;";
        cmd.ExecuteNonQuery();

        cmd.CommandText = "SELECT visits_count FROM visits_counter;";
        this.VisitsCount = Convert.ToInt32(cmd.ExecuteScalar());
      }
    }

    private string ConnectionString()
    {
      var url = new Uri(Environment.GetEnvironmentVariable("DATABASE_URL"));
      var cs = "";

      if (url.AbsolutePath != null && url.AbsolutePath != "/")
      {
        cs += "Database=" + url.AbsolutePath.Trim('/') + ";";
      }
      if (url.UserInfo != null)
      {
        var parts = url.UserInfo.Split(":");
        cs += "Username=" + parts[0] + ";";
        if (parts.Length > 1)
        {
          cs += "Password=" + parts[1] + ";";
        }
      }
      if (url.Host != null)
      {
        cs += "Host=" + url.Host + ";";
      }
      if (url.Port != -1)
      {
        cs += "Port=" + url.Port + ";";
      }

      return cs;
    }
  }
}
